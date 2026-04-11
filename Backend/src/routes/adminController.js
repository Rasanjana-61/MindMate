const { User } = require("../models/User");
const { PeerPost } = require("../models/PeerPost");
const { PeerReply } = require("../models/PeerReply");
const Notification = require("../models/Notification");
const { Resource } = require("../models/Resource");
const { getIO } = require("../utils/socket");

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const day7 = new Date(now - 7 * 86400000);
    const day30 = new Date(now - 30 * 86400000);

    const [totalUsers, newUsersWeek, totalPosts, postsWeek, postsMonth, pendingResources] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: day7 } }),
      PeerPost.countDocuments({ isDeleted: false }),
      PeerPost.countDocuments({ isDeleted: false, createdAt: { $gte: day7 } }),
      PeerPost.countDocuments({ isDeleted: false, createdAt: { $gte: day30 } }),
      Resource.countDocuments({ status: "pending" }),
    ]);

    // Total replies
    const totalReplies = await PeerReply.countDocuments({ isDeleted: false });

    // Reports pending (if you add a reports field to PeerPost)
    const reportedPosts = await PeerPost.countDocuments({ 
      reports: { $exists: true, $ne: [] }, 
      isDeleted: false 
    });

    // Posts per day (last 14 days)
    const activityData = await PeerPost.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: new Date(now - 14 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, questions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days
    const activity = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const found = activityData.find(a => a._id === key);
      activity.push({ 
        date: key, 
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), 
        questions: found?.questions || 0 
      });
    }

    // Category breakdown
    const categoryBreakdown = await PeerPost.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top posts by reply count
    const topQuestions = await PeerPost.aggregate([
      { $match: { isDeleted: false } },
      { $addFields: { replyCount: { $size: "$replies" } } },
      { $sort: { replyCount: -1 } },
      { $limit: 5 },
      { $project: { content: 1, category: 1, replyCount: 1, createdAt: 1 } },
    ]);

    // Recent user registrations
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email faculty createdAt role");

    // Engagement rate (posts with at least 1 reply)
    const withReplies = await PeerPost.countDocuments({ isDeleted: false, replies: { $ne: [] } });
    const engagementRate = totalPosts > 0 ? Math.round((withReplies / totalPosts) * 100) : 0;

    res.json({
      success: true,
      data: {
        summary: { 
          totalUsers, 
          newUsersWeek, 
          totalPosts, 
          postsWeek, 
          postsMonth, 
          totalReplies, 
          reportedPosts, 
          engagementRate,
          pendingResources
        },
        activity,
        categoryBreakdown,
        topQuestions,
        recentUsers,
      }
    });
  } catch (e) { 
    next(e); 
  }
};

// GET /api/admin/reports
const getReports = async (req, res, next) => {
  try {
    const posts = await PeerPost.find({ 
      reports: { $exists: true, $ne: [] }, 
      isDeleted: false 
    })
      .select("content category reports createdAt")
      .sort({ "reports.createdAt": -1 });

    const data = posts.map(p => ({
      _id: p._id,
      content: p.content,
      category: p.category,
      createdAt: p.createdAt,
      reportCount: p.reports.length,
      reports: p.reports.map(r => ({ 
        _id: r._id,
        userId: r.userId,
        reason: r.reason || "Inappropriate content", 
        details: r.details || "", 
        createdAt: r.createdAt 
      })),
    }));

    res.json({ success: true, count: data.length, data });
  } catch (e) { 
    next(e); 
  }
};

// PUT /api/admin/reports/:postId/resolve
const resolveReport = async (req, res, next) => {
  try {
    const post = await PeerPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    
    post.reports = [];
    await post.save();
    
    // Emit socket event to notify users that report was resolved
    const io = getIO();
    if (io) {
      console.log(`[ADMIN] Emitting report:resolved event for post ID: ${req.params.postId}`);
      io.emit("report:resolved", { postId: req.params.postId });
    } else {
      console.error('[ADMIN] Socket.io instance not available');
    }
    
    res.json({ success: true, message: "All reports resolved for this post" });
  } catch (e) { 
    next(e); 
  }
};

// DELETE /api/admin/posts/:id (force delete)
const forceDeletePost = async (req, res, next) => {
  try {
    const post = await PeerPost.findByIdAndUpdate(req.params.id, { isDeleted: true });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    
    // Emit socket event to notify all users that post was deleted
    const io = getIO();
    if (io) {
      console.log(`[ADMIN] Emitting post:deleted event for post ID: ${req.params.id}`);
      io.emit("post:deleted", { postId: req.params.id });
    } else {
      console.error('[ADMIN] Socket.io instance not available');
    }
    
    res.json({ success: true, message: "Post removed by admin" });
  } catch (e) { 
    next(e); 
  }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select("-password");
    
    res.json({ success: true, count: users.length, data: users });
  } catch (e) { 
    next(e); 
  }
};

// PUT /api/admin/users/:id/toggle
const toggleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    // Don't allow deactivating the last admin
    if (user.role === "admin" && user.isActive) {
      const adminCount = await User.countDocuments({ role: "admin", isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "Cannot deactivate the last admin" });
      }
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}`, isActive: user.isActive });
  } catch (e) { 
    next(e); 
  }
};

// GET /api/admin/resources/pending
const getPendingResources = async (req, res, next) => {
  try {
    const resources = await Resource.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("user", "fullName email studentId faculty");
    
    res.json({ success: true, count: resources.length, data: resources });
  } catch (e) {
    next(e);
  }
};

// PUT /api/admin/resources/:id/approve
const approveResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });

    resource.status = "approved";
    await resource.save();

    res.json({ success: true, message: "Resource approved and published!" });
  } catch (e) {
    next(e);
  }
};

// PUT /api/admin/resources/:id/reject
const rejectResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });

    resource.status = "rejected";
    await resource.save();

    res.json({ success: true, message: "Resource rejected." });
  } catch (e) {
    next(e);
  }
};

module.exports = { 
  getStats, 
  getReports, 
  resolveReport, 
  forceDeletePost, 
  getUsers, 
  toggleUser,
  getPendingResources,
  approveResource,
  rejectResource
};
