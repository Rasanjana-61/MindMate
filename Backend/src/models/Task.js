const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 400,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    pomodoros: {
      type: Number,
      default: 1,
    },
    totalTimeSpent: {
      type: Number,
      default: 0, // In minutes
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ user: 1, completed: 1, dueDate: 1, createdAt: -1 });

module.exports = {
  Task: mongoose.model("Task", taskSchema),
};
