const mongoose = require("mongoose");

const focusSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionType: {
      type: String,
      enum: ["focus", "break"],
      default: "focus",
    },
    plannedDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 240,
    },
    completedDurationMinutes: {
      type: Number,
      required: true,
      min: 0.1,
      max: 240,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    completedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

focusSessionSchema.index({ user: 1, completedAt: -1 });

module.exports = {
  FocusSession: mongoose.model("FocusSession", focusSessionSchema),
};
