const mongoose = require("mongoose");

const moodLogSchema = new mongoose.Schema(
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
    entryDate: {
      type: Date,
      required: true,
    },
    moodValue: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    stressLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    energyLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    insight: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

moodLogSchema.index({ user: 1, entryDate: 1 }, { unique: true });

module.exports = {
  MoodLog: mongoose.model("MoodLog", moodLogSchema),
};
