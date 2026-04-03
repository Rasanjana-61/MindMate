const express = require("express");
const router = express.Router();
const { 
  getStats, 
  getReports, 
  resolveReport, 
  forceDeletePost, 
  getUsers, 
  toggleUser,
  getPendingResources,
  approveResource,
  rejectResource
} = require("../routes/adminController");
const { protect } = require("../middleware/authMiddleware");

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

// All routes are protected and require admin role
router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/reports", getReports);
router.put("/reports/:postId/resolve", resolveReport);
router.delete("/posts/:id", forceDeletePost);
router.get("/users", getUsers);
router.put("/users/:id/toggle", toggleUser);

// Resource Moderation
router.get("/resources/pending", getPendingResources);
router.put("/resources/:id/approve", approveResource);
router.put("/resources/:id/reject", rejectResource);

module.exports = router;
