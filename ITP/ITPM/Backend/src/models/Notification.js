const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "peer_reply",
        "task_created",
        "task_updated",
        "task_completed",
        "task_deleted",
        "focus_completed",
        "mood_logged",
        "mood_updated",
        "mood_deleted",
        "resource_ready",
        "resource_regenerated",
        "resource_deleted",
      ],
      required: true,
    },
    module: {
      type: String,
      enum: ["focus", "mood", "peer", "resources"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    linkPage: {
      type: String,
      enum: ["focus", "mood", "peer", "resources"],
      default: "",
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PeerPost",
      default: null,
    },
    reply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PeerReply",
      default: null,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = {
  Notification: mongoose.model("Notification", notificationSchema),
};
