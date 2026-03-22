import mongoose from "mongoose";

const { Schema, model } = mongoose;

const JournalEntrySchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  entryDate: {
    type: Date,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  moodScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  stressScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  energyScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  emotion: {
    type: String,
    enum: ["anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"]
  },
  emotionScores: {
    type: Map,
    of: Number,
    default: {}
  },
  sentiment: {
    type: String,
    enum: ["Positive", "Neutral", "Negative"]
  },
  summaryText: {
    type: String
  },
  suggestions: {
    type: [String],
    default: []
  }
}, {
  timestamps: true // automatically adds createdAt and updatedAt
});

// Ensure one entry per user per date
//JournalEntrySchema.index({ userId: 1, entryDate: 1 }, { unique: true });

const JournalEntry = model("JournalEntry", JournalEntrySchema);

export default JournalEntry;
