import mongoose from 'mongoose';

const focusSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    focusDuration: {
      type: Number,
      required: true,
      default: 25,
      min: 10,
      max: 90,
    },
    breakDuration: {
      type: Number,
      required: true,
      default: 5,
      min: 5,
      max: 30,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export default mongoose.model('FocusSettings', focusSettingsSchema);
