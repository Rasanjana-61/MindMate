const mongoose = require("mongoose");

const CATEGORIES = [
  "Stress",
  "Exams",
  "Relationships",
  "Academic Difficulty",
  "Personal Growth",
];

const peerPostSchema = new mongoose.Schema(
  {
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
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    keywords: {
      type: [String],
      default: [],
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
    replies: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "PeerReply",
      default: [],
    },
    reports: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        reason: {
          type: String,
          default: "Inappropriate content",
        },
        details: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

peerPostSchema.index({ faculty: 1, category: 1, createdAt: -1 });

module.exports = {
  PeerPost: mongoose.model("PeerPost", peerPostSchema),
  PEER_CATEGORIES: CATEGORIES,
};
