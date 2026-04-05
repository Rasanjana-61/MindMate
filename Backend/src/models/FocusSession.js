import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      required: true,
      enum: ['Focus', 'Break'],
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    completedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export default mongoose.model('FocusSession', focusSessionSchema);
