const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entryDate: {
      type: Date,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    stressScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    energyScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    emotion: {
      type: String,
      default: "neutral",
    },
    emotionScores: {
      type: Map,
      of: Number,
      default: {},
    },
    sentiment: {
      type: String,
      enum: ["Positive", "Neutral", "Negative"],
      default: "Neutral",
    },
    summaryText: {
      type: String,
      default: "",
    },
    suggestions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

journalEntrySchema.index({ userId: 1, entryDate: 1 }, { unique: true });

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);

module.exports = {
  JournalEntry,
};
