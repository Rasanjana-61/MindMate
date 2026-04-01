const mongoose = require("mongoose");

const peerMatchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    matchedUserId: {
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
    // Match score factors
    compatibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    categoryOverlap: {
      type: [String],
      default: [],
    },
    keywordOverlap: {
      type: [String],
      default: [],
    },
    sharedChallenges: {
      type: [String],
      default: [],
    },
    // Interaction tracking
    isMutualInterest: {
      type: Boolean,
      default: false,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    lastInteractionAt: {
      type: Date,
      default: null,
    },
    dismissedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    expireAfterSeconds: 2592000, // Auto-delete after 30 days of creation
  }
);

// Unique index to prevent duplicates
peerMatchSchema.index(
  { userId: 1, matchedUserId: 1 },
  { unique: true, sparse: true }
);

// Index for finding matches for a user
peerMatchSchema.index({ userId: 1, compatibilityScore: -1, createdAt: -1 });

module.exports = {
  PeerMatch: mongoose.model("PeerMatch", peerMatchSchema),
};
