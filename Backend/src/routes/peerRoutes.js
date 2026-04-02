const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { PeerPost, PEER_CATEGORIES } = require("../models/PeerPost");
const { PeerReply } = require("../models/PeerReply");
const { Notification } = require("../models/Notification");
const { PeerMatch } = require("../models/PeerMatch");
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

// Advanced peer matching algorithm
function calculateCompatibilityScore(userCategories, userKeywords, peerCategories, peerKeywords) {
  let score = 0;

  // Category overlap (40% weight)
  const categoryOverlap = userCategories.filter(cat => peerCategories.includes(cat)).length;
  const categoryScore = (categoryOverlap / Math.max(userCategories.length, 1)) * 40;
  score += categoryScore;

  // Keyword overlap (40% weight)
  const keywordOverlap = userKeywords.filter(kw => peerKeywords.includes(kw)).length;
  const keywordScore = (keywordOverlap / Math.max(userKeywords.length, 1)) * 40;
  score += keywordScore;

  // Diversity bonus (20% weight) - ensure both have multiple interests
  const diversityBonus = Math.min(userCategories.length, peerCategories.length) > 1 ? 20 : 10;
  score += diversityBonus;

  return Math.round(score);
}

async function buildSuggestedConnections(userId, faculty, userDoc) {
  try {
    // Get user's recent posts and interactions
    const recentPosts = await PeerPost.find({
      user: userId,
      faculty,
      moderationStatus: "visible",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (!recentPosts.length) {
      return [];
    }

    const userCategories = [...new Set(recentPosts.map(post => post.category))];
    const userKeywords = [...new Set(recentPosts.flatMap(post => post.keywords || []))];

    // Get all candidate peers
    const candidatePeers = await PeerPost.aggregate([
      {
        $match: {
          user: { $ne: userId },
          faculty,
          moderationStatus: "visible",
          $or: [
            userCategories.length ? { category: { $in: userCategories } } : null,
            userKeywords.length ? { keywords: { $in: userKeywords } } : null,
          ].filter(Boolean),
        },
      },
      {
        $group: {
          _id: "$user",
          categories: { $push: "$category" },
          keywords: { $push: "$keywords" },
          replyCount: { $sum: 1 },
          latestAt: { $max: "$createdAt" },
        },
      },
      {
        $limit: 50,
      },
    ]);

    // Calculate compatibility scores
    const matchScores = await Promise.all(
      candidatePeers.map(async (peer) => {
        const peerCategories = [...new Set(peer.categories)];
        const peerKeywords = [...new Set(peer.keywords.flat())];

        const compatibilityScore = calculateCompatibilityScore(
          userCategories,
          userKeywords,
          peerCategories,
          peerKeywords
        );

        // Check for existing match record
        let existingMatch = await PeerMatch.findOne({
          userId,
          matchedUserId: peer._id,
        }).lean();

        // Update or create match record
        if (existingMatch && !existingMatch.dismissedAt) {
          await PeerMatch.findByIdAndUpdate(existingMatch._id, {
            compatibilityScore,
            categoryOverlap: peerCategories.filter(cat => userCategories.includes(cat)),
            keywordOverlap: peerKeywords.filter(kw => userKeywords.includes(kw)),
            lastInteractionAt: new Date(),
          });
        } else if (!existingMatch) {
          await PeerMatch.create({
            userId,
            matchedUserId: peer._id,
            faculty,
            compatibilityScore,
            categoryOverlap: peerCategories.filter(cat => userCategories.includes(cat)),
            keywordOverlap: peerKeywords.filter(kw => userKeywords.includes(kw)),
            sharedChallenges: userCategories.filter(cat => peerCategories.includes(cat)),
          }).catch(() => null); // Ignore duplicates
        }

        return {
          peerId: String(peer._id),
          compatibilityScore,
          peerCategories,
          peerKeywords,
          replyCount: peer.replyCount,
          latestAt: peer.latestAt,
          categoryOverlap: peerCategories.filter(cat => userCategories.includes(cat)),
          keywordOverlap: peerKeywords.filter(kw => userKeywords.includes(kw)),
        };
      })
    );

    // Sort by compatibility score and return top matches
    return matchScores
      .filter(match => match.compatibilityScore >= 30) // Minimum 30% compatibility
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 5)
      .map((match, index) => ({
        id: `peer-${match.peerId}-${index}`,
        label: `Peer #${match.peerId.slice(-4)}`,
        compatibilityScore: match.compatibilityScore,
        overlapCategories: match.categoryOverlap.slice(0, 2),
        overlapKeywords: match.keywordOverlap.slice(0, 3),
        latestAt: match.latestAt,
        reason: `${match.categoryOverlap.length} shared interest${match.categoryOverlap.length !== 1 ? 's' : ''}`,
      }));
  } catch (error) {
    console.error("Error building suggested connections:", error);
    return [];
  }
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

    // Validate parentReply if provided
    let parentReply = null;
    if (req.body.parentReplyId) {
      parentReply = await PeerReply.findOne({
        _id: req.body.parentReplyId,
        post: post._id,
        moderationStatus: "visible",
      });

      if (!parentReply) {
        return res.status(404).json({ message: "Parent reply not found." });
      }
    }

    const isFlagged = containsFlaggedContent(values.content);

    const reply = await PeerReply.create({
      post: post._id,
      user: req.user._id,
      faculty: req.user.faculty,
      content: values.content,
      parentReply: parentReply ? parentReply._id : null,
      isFlagged,
      moderationStatus: isFlagged ? "hidden" : "visible",
    });

    // Send notifications
    if (!isFlagged) {
      // Case 1: Non-post-owner replying to the post directly → notify post owner
      if (!parentReply && String(post.user) !== String(req.user._id)) {
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

      // Case 2: Post owner replying to the post directly → notify all other reply authors
      if (!parentReply && String(post.user) === String(req.user._id)) {
        const existingReplies = await PeerReply.distinct("user", {
          post: post._id,
          user: { $ne: req.user._id },
          moderationStatus: "visible",
        });

        for (const userId of existingReplies) {
          await createNotification({
            user: userId,
            type: "peer_reply",
            module: "peer",
            title: "Post owner replied",
            message: `The post owner replied to their ${post.category.toLowerCase()} post.`,
            linkPage: "peer",
            post: post._id,
            reply: reply._id,
          });
        }
      }

      // Case 3: User replying to a reply → notify the reply author
      if (parentReply && String(parentReply.user) !== String(req.user._id)) {
        await createNotification({
          user: parentReply.user,
          type: "peer_reply",
          module: "peer",
          title: "New anonymous reply",
          message: `Someone replied to your comment on a ${post.category.toLowerCase()} post.`,
          linkPage: "peer",
          post: post._id,
          reply: reply._id,
        });
      }
    }

    return res.status(201).json({
      message: isFlagged
        ? "Reply submitted for moderator review."
        : "Reply added successfully.",
      reply: {
        id: reply._id,
        postId: reply.post,
        content: reply.content,
        parentReplyId: reply.parentReply,
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

// POST /api/peer/matches/:matchedPeerId/dismiss - Dismiss a peer match suggestion
router.post("/matches/:matchedPeerId/dismiss", async (req, res) => {
  try {
    const { matchedPeerId } = req.params;

    // Find and update the match record to mark as dismissed
    const match = await PeerMatch.findOneAndUpdate(
      {
        userId: req.user._id,
        matchedUserId: matchedPeerId,
      },
      {
        dismissedAt: new Date(),
      },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    return res.json({ 
      message: "Peer suggestion dismissed. It won't appear again.",
      dismissedAt: match.dismissedAt
    });
  } catch (error) {
    console.error("Dismiss peer match error:", error);
    return res.status(500).json({ message: "Server error while dismissing suggestion." });
  }
});

// GET /api/peer/matches/stats - Get peer matching statistics
router.get("/matches/stats", async (req, res) => {
  try {
    const stats = await PeerMatch.aggregate([
      {
        $match: { userId: req.user._id },
      },
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          avgCompatibilityScore: { $avg: "$compatibilityScore" },
          dismissedCount: {
            $sum: { $cond: ["$dismissedAt", 1, 0] },
          },
        },
      },
    ]);

    const matchStats = stats[0] || {
      totalMatches: 0,
      avgCompatibilityScore: 0,
      dismissedCount: 0,
    };

    return res.json(matchStats);
  } catch (error) {
    console.error("Get match stats error:", error);
    return res.status(500).json({ message: "Server error while fetching statistics." });
  }
});

module.exports = router;
