const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { PeerPost, PEER_CATEGORIES } = require("../models/PeerPost");
const { PeerReply } = require("../models/PeerReply");
const { Notification } = require("../models/Notification");
const { createNotification, formatNotification } = require("../utils/notifications");

const router = express.Router();

const FLAGGED_TERMS = [
  "kill yourself",
  "suicide",
  "nude",
  "hate you",
  "idiot",
  "stupid",
  "racist",
  "sex",
  "fuck",
  "bitch",
];

function containsFlaggedContent(text) {
  const normalized = text.toLowerCase();
  return FLAGGED_TERMS.some((term) => normalized.includes(term));
}

function extractKeywords(text) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "have",
    "this",
    "from",
    "your",
    "just",
    "about",
    "into",
    "really",
    "been",
    "feel",
    "feeling",
    "need",
    "what",
    "when",
    "where",
    "how",
    "does",
    "want",
    "will",
    "they",
    "them",
    "their",
    "because",
    "after",
    "before",
    "while",
    "during",
    "could",
    "would",
    "should",
    "over",
    "under",
    "away",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !stopWords.has(word));

  return [...new Set(words)].slice(0, 8);
}

function validatePostPayload(payload) {
  const errors = {};

  if (!payload.content?.trim()) {
    errors.content = "Post content is required.";
  } else if (payload.content.trim().length > 500) {
    errors.content = "Post content must be 500 characters or less.";
  }

  if (!PEER_CATEGORIES.includes(payload.category)) {
    errors.category = "Select a valid category.";
  }

  return {
    errors,
    values: {
      content: payload.content?.trim() || "",
      category: payload.category,
    },
  };
}

function validateReplyPayload(payload) {
  const errors = {};

  if (!payload.content?.trim()) {
    errors.content = "Reply content is required.";
  } else if (payload.content.trim().length > 400) {
    errors.content = "Reply content must be 400 characters or less.";
  }

  return {
    errors,
    values: {
      content: payload.content?.trim() || "",
    },
  };
}

function formatPost(post, replies, currentUserId) {
  return {
    id: post._id,
    category: post.category,
    content: post.content,
    faculty: post.faculty,
    isOwn: String(post.user) === String(currentUserId),
    isFlagged: post.isFlagged,
    isBookmarked: post.bookmarkedBy.some(userId => String(userId) === String(currentUserId)),
    isLiked: post.likedBy.some(userId => String(userId) === String(currentUserId)),
    likeCount: post.likedBy.length,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    replyCount: replies.length,
    replies: replies.map((reply) => ({
      id: reply._id,
      postId: reply.post,
      content: reply.content,
      isOwn: String(reply.user) === String(currentUserId),
      isFlagged: reply.isFlagged,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    })),
  };
}

async function buildSuggestedConnections(userId, faculty) {
  const recentPosts = await PeerPost.find({
    user: userId,
    faculty,
    moderationStatus: "visible",
  })
    .sort({ createdAt: -1 })
    .limit(5);

  const categories = [...new Set(recentPosts.map((post) => post.category))];
  const keywords = [...new Set(recentPosts.flatMap((post) => post.keywords || []))];

  if (!categories.length && !keywords.length) {
    return [];
  }

  const peerPosts = await PeerPost.find({
    user: { $ne: userId },
    faculty,
    moderationStatus: "visible",
    $or: [
      categories.length ? { category: { $in: categories } } : null,
      keywords.length ? { keywords: { $in: keywords } } : null,
    ].filter(Boolean),
  }).sort({ createdAt: -1 });

  const grouped = new Map();

  peerPosts.forEach((post) => {
    const key = String(post.user);
    if (!grouped.has(key)) {
      grouped.set(key, {
        peerKey: `Peer-${key.slice(-4)}`,
        overlapCategories: new Set(),
        overlapKeywords: new Set(),
        latestAt: post.createdAt,
      });
    }

    const entry = grouped.get(key);
    if (categories.includes(post.category)) {
      entry.overlapCategories.add(post.category);
    }
    post.keywords.forEach((keyword) => {
      if (keywords.includes(keyword)) {
        entry.overlapKeywords.add(keyword);
      }
    });
  });

  return [...grouped.values()]
    .sort(
      (a, b) =>
        b.overlapCategories.size + b.overlapKeywords.size - (a.overlapCategories.size + a.overlapKeywords.size)
    )
    .slice(0, 3)
    .map((entry, index) => ({
      id: `${entry.peerKey}-${index}`,
      label: `Peer #${entry.peerKey.slice(-4)}`,
      overlapCategories: [...entry.overlapCategories].slice(0, 2),
      overlapKeywords: [...entry.overlapKeywords].slice(0, 3),
      latestAt: entry.latestAt,
    }));
}

async function buildOverview(req, category) {
  const baseFilter = {
    faculty: req.user.faculty,
    moderationStatus: "visible",
  };
  const filter = { ...baseFilter };

  if (category && category !== "All") {
    filter.category = category;
  }

  const posts = await PeerPost.find(filter).sort({ createdAt: -1 });
  const postIds = posts.map((post) => post._id);
  const replies = await PeerReply.find({
    post: { $in: postIds },
    faculty: req.user.faculty,
    moderationStatus: "visible",
  }).sort({ createdAt: 1 });

  const repliesByPost = replies.reduce((accumulator, reply) => {
    const key = String(reply.post);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(reply);
    return accumulator;
  }, {});

  const categoryCounts = await PeerPost.aggregate([
    {
      $match: baseFilter,
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  const notifications = await Notification.find({ user: req.user._id, module: "peer" })
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    posts: posts.map((post) => formatPost(post, repliesByPost[String(post._id)] || [], req.user._id)),
    categories: [
      {
        name: "All",
        count: await PeerPost.countDocuments(baseFilter),
      },
      ...PEER_CATEGORIES.map((name) => ({
        name,
        count: categoryCounts.find((entry) => entry._id === name)?.count || 0,
      })),
    ],
    notifications: notifications.map((notification) => ({
      ...formatNotification(notification),
      category: notification.title,
      replyPreview: notification.message,
    })),
    unreadNotificationCount: notifications.filter((notification) => !notification.isRead).length,
    suggestedConnections: await buildSuggestedConnections(req.user._id, req.user.faculty),
    moderationNotice:
      "Posts and replies stay anonymous to other students, but harmful or inappropriate content is flagged for review.",
  };
}

router.use(protect);

router.get("/overview", async (req, res) => {
  try {
    const category = req.query.category;
    return res.json(await buildOverview(req, category));
  } catch (error) {
    console.error("Fetch peer overview error:", error);
    return res.status(500).json({ message: "Server error while loading peer discussions." });
  }
});

router.post("/posts", async (req, res) => {
  try {
    const { errors, values } = validatePostPayload(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted post fields.",
        errors,
      });
    }

    const isFlagged = containsFlaggedContent(values.content);

    const post = await PeerPost.create({
      user: req.user._id,
      faculty: req.user.faculty,
      category: values.category,
      content: values.content,
      keywords: extractKeywords(values.content),
      isFlagged,
      moderationStatus: isFlagged ? "hidden" : "visible",
    });

    if (isFlagged) {
      return res.status(201).json({
        message: "Your post was saved for moderator review before it appears in the discussion feed.",
        post: formatPost(post, [], req.user._id),
      });
    }

    return res.status(201).json({
      message: "Post created successfully.",
      post: formatPost(post, [], req.user._id),
    });
  } catch (error) {
    console.error("Create peer post error:", error);
    return res.status(500).json({ message: "Server error while creating post." });
  }
});

router.put("/posts/:id", async (req, res) => {
  try {
    const { errors, values } = validatePostPayload(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted post fields.",
        errors,
      });
    }

    const post = await PeerPost.findOne({
      _id: req.params.id,
      user: req.user._id,
      faculty: req.user.faculty,
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const isFlagged = containsFlaggedContent(values.content);

    post.category = values.category;
    post.content = values.content;
    post.keywords = extractKeywords(values.content);
    post.isFlagged = isFlagged;
    post.moderationStatus = isFlagged ? "hidden" : "visible";
    await post.save();

    return res.json({
      message: isFlagged
        ? "Post updated and sent for moderator review."
        : "Post updated successfully.",
      post: formatPost(post, [], req.user._id),
    });
  } catch (error) {
    console.error("Update peer post error:", error);
    return res.status(500).json({ message: "Server error while updating post." });
  }
});

router.delete("/posts/:id", async (req, res) => {
  try {
    const post = await PeerPost.findOne({
      _id: req.params.id,
      user: req.user._id,
      faculty: req.user.faculty,
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    await Promise.all([
      PeerReply.deleteMany({ post: post._id }),
      Notification.deleteMany({ post: post._id }),
      post.deleteOne(),
    ]);

    return res.json({ message: "Post deleted successfully." });
  } catch (error) {
    console.error("Delete peer post error:", error);
    return res.status(500).json({ message: "Server error while deleting post." });
  }
});

router.post("/posts/:postId/replies", async (req, res) => {
  try {
    const { errors, values } = validateReplyPayload(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted reply fields.",
        errors,
      });
    }

    const post = await PeerPost.findOne({
      _id: req.params.postId,
      faculty: req.user.faculty,
      moderationStatus: "visible",
    });

    if (!post) {
      return res.status(404).json({ message: "Discussion post not found." });
    }

    const isFlagged = containsFlaggedContent(values.content);

    const reply = await PeerReply.create({
      post: post._id,
      user: req.user._id,
      faculty: req.user.faculty,
      content: values.content,
      isFlagged,
      moderationStatus: isFlagged ? "hidden" : "visible",
    });

    if (!isFlagged && String(post.user) !== String(req.user._id)) {
      await createNotification({
        user: post.user,
        type: "peer_reply",
        module: "peer",
        title: "New anonymous reply",
        message: `Someone replied to your ${post.category.toLowerCase()} post.`,
        linkPage: "peer",
        post: post._id,
        reply: reply._id,
      });
    }

    return res.status(201).json({
      message: isFlagged
        ? "Reply submitted for moderator review."
        : "Reply added successfully.",
      reply: {
        id: reply._id,
        postId: reply.post,
        content: reply.content,
        isOwn: true,
        isFlagged: reply.isFlagged,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create peer reply error:", error);
    return res.status(500).json({ message: "Server error while adding reply." });
  }
});

router.put("/replies/:id", async (req, res) => {
  try {
    const { errors, values } = validateReplyPayload(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted reply fields.",
        errors,
      });
    }

    const reply = await PeerReply.findOne({
      _id: req.params.id,
      user: req.user._id,
      faculty: req.user.faculty,
    });

    if (!reply) {
      return res.status(404).json({ message: "Reply not found." });
    }

    const isFlagged = containsFlaggedContent(values.content);
    reply.content = values.content;
    reply.isFlagged = isFlagged;
    reply.moderationStatus = isFlagged ? "hidden" : "visible";
    await reply.save();

    return res.json({
      message: isFlagged
        ? "Reply updated and sent for moderator review."
        : "Reply updated successfully.",
      reply: {
        id: reply._id,
        postId: reply.post,
        content: reply.content,
        isOwn: true,
        isFlagged: reply.isFlagged,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update peer reply error:", error);
    return res.status(500).json({ message: "Server error while updating reply." });
  }
});

router.delete("/replies/:id", async (req, res) => {
  try {
    const reply = await PeerReply.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      faculty: req.user.faculty,
    });

    if (!reply) {
      return res.status(404).json({ message: "Reply not found." });
    }

    await Notification.deleteMany({ reply: reply._id });

    return res.json({ message: "Reply deleted successfully." });
  } catch (error) {
    console.error("Delete peer reply error:", error);
    return res.status(500).json({ message: "Server error while deleting reply." });
  }
});

router.post("/notifications/read", async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        module: "peer",
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return res.json({ message: "Notifications marked as read." });
  } catch (error) {
    console.error("Read notifications error:", error);
    return res.status(500).json({ message: "Server error while updating notifications." });
  }
});

// POST /api/peer/posts/:postId/bookmark - Add bookmark
router.post("/posts/:postId/bookmark", async (req, res) => {
  try {
    const post = await PeerPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const userId = req.user._id;
    const isAlreadyBookmarked = post.bookmarkedBy.some(id => String(id) === String(userId));

    if (isAlreadyBookmarked) {
      return res.status(400).json({ message: "Post is already bookmarked." });
    }

    post.bookmarkedBy.push(userId);
    await post.save();

    return res.json({ 
      message: "Post bookmarked successfully.",
      isBookmarked: true
    });
  } catch (error) {
    console.error("Bookmark post error:", error);
    return res.status(500).json({ message: "Server error while bookmarking post." });
  }
});

// DELETE /api/peer/posts/:postId/bookmark - Remove bookmark
router.delete("/posts/:postId/bookmark", async (req, res) => {
  try {
    const post = await PeerPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const userId = req.user._id;
    post.bookmarkedBy = post.bookmarkedBy.filter(id => String(id) !== String(userId));
    await post.save();

    return res.json({ 
      message: "Bookmark removed successfully.",
      isBookmarked: false
    });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    return res.status(500).json({ message: "Server error while removing bookmark." });
  }
});

// GET /api/peer/bookmarks - Get all bookmarked posts
router.get("/bookmarks", async (req, res) => {
  try {
    const posts = await PeerPost.find({
      bookmarkedBy: req.user._id,
      moderationStatus: "visible",
      isDeleted: false,
    }).sort({ createdAt: -1 });

    const postIds = posts.map((post) => post._id);
    const replies = await PeerReply.find({
      post: { $in: postIds },
      moderationStatus: "visible",
    }).sort({ createdAt: 1 });

    const repliesByPost = replies.reduce((accumulator, reply) => {
      const key = String(reply.post);
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(reply);
      return accumulator;
    }, {});

    const formattedPosts = posts.map((post) => 
      formatPost(post, repliesByPost[String(post._id)] || [], req.user._id)
    );

    return res.json({
      success: true,
      count: formattedPosts.length,
      data: formattedPosts,
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    return res.status(500).json({ message: "Server error while loading bookmarks." });
  }
});

// POST /api/peer/posts/:postId/like - Add like
router.post("/posts/:postId/like", async (req, res) => {
  try {
    const post = await PeerPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const userId = req.user._id;
    const isAlreadyLiked = post.likedBy.some(id => String(id) === String(userId));

    if (isAlreadyLiked) {
      return res.status(400).json({ message: "Post is already liked." });
    }

    post.likedBy.push(userId);
    await post.save();

    return res.json({ 
      message: "Post liked successfully.",
      isLiked: true,
      likeCount: post.likedBy.length
    });
  } catch (error) {
    console.error("Like post error:", error);
    return res.status(500).json({ message: "Server error while liking post." });
  }
});

// DELETE /api/peer/posts/:postId/like - Remove like
router.delete("/posts/:postId/like", async (req, res) => {
  try {
    const post = await PeerPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const userId = req.user._id;
    post.likedBy = post.likedBy.filter(id => String(id) !== String(userId));
    await post.save();

    return res.json({ 
      message: "Like removed successfully.",
      isLiked: false,
      likeCount: post.likedBy.length
    });
  } catch (error) {
    console.error("Remove like error:", error);
    return res.status(500).json({ message: "Server error while removing like." });
  }
});

// POST /api/peer/posts/:postId/report - Report a post
router.post("/posts/:postId/report", async (req, res) => {
  try {
    const post = await PeerPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const { reason, details } = req.body;
    const userId = req.user._id;

    // Check if user already reported this post
    const alreadyReported = post.reports.some(report => String(report.userId) === String(userId));

    if (alreadyReported) {
      return res.status(400).json({ message: "You have already reported this post." });
    }

    // Add report
    post.reports.push({
      userId,
      reason: reason || "Inappropriate content",
      details: details || "",
      createdAt: new Date(),
    });

    await post.save();

    return res.json({ 
      message: "Post reported successfully. Thank you for helping keep our community safe.",
      reportCount: post.reports.length
    });
  } catch (error) {
    console.error("Report post error:", error);
    return res.status(500).json({ message: "Server error while reporting post." });
  }
});

module.exports = router;
