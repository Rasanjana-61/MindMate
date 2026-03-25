const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { Notification } = require("../models/Notification");
const { formatNotification } = require("../utils/notifications");

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({
      notifications: notifications.map(formatNotification),
      unreadCount: notifications.filter((notification) => !notification.isRead).length,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res.status(500).json({ message: "Server error while loading notifications." });
  }
});

router.post("/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({ message: "Notifications marked as read." });
  } catch (error) {
    console.error("Read all notifications error:", error);
    return res.status(500).json({ message: "Server error while updating notifications." });
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    return res.json({
      message: "Notification marked as read.",
      notification: formatNotification(notification),
    });
  } catch (error) {
    console.error("Read notification error:", error);
    return res.status(500).json({ message: "Server error while updating notification." });
  }
});

module.exports = router;
