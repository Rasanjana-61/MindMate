const mongoose = require("mongoose");

const definitionSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      trim: true,
      default: "",
    },
    definition: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    faculty: {
      type: String,
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    storedFilePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    extractedText: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: "",
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    definitions: {
      type: [definitionSchema],
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    processingStatus: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ user: 1, createdAt: -1 });

module.exports = {
  Resource: mongoose.model("Resource", resourceSchema),
};
