const mongoose = require("mongoose");

const peerReplySchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PeerPost",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    faculty: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    moderationStatus: {
      type: String,
      enum: ["visible", "hidden"],
      default: "visible",
    },
  },
  {
    timestamps: true,
  }
);

peerReplySchema.index({ post: 1, createdAt: 1 });

module.exports = {
  PeerReply: mongoose.model("PeerReply", peerReplySchema),
};
