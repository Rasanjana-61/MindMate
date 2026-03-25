const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const FACULTIES = ["FOC", "FOB", "FOE", "FAS", "FOL"];
const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];
const SEMESTERS = ["Semester 1", "Semester 2"];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    faculty: {
      type: String,
      required: true,
      enum: FACULTIES,
    },
    year: {
      type: String,
      required: true,
      enum: YEARS,
    },
    semester: {
      type: String,
      required: true,
      enum: SEMESTERS,
    },
    academicCycleStartedAt: {
      type: Date,
      default: Date.now,
    },
    academicStartYear: {
      type: String,
      enum: YEARS,
      default: function defaultAcademicStartYear() {
        return this.year || "Year 1";
      },
    },
    academicStartSemester: {
      type: String,
      enum: SEMESTERS,
      default: function defaultAcademicStartSemester() {
        return this.semester || "Semester 1";
      },
    },
    role: {
      type: String,
      default: "student",
      enum: ["student", "admin"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    preferences: {
      focusDuration: {
        type: String,
        default: "25",
      },
      breakDuration: {
        type: String,
        default: "5",
      },
      dailyGoal: {
        type: Number,
        default: 4,
      },
      notifications: {
        focus: { type: Boolean, default: true },
        mood: { type: Boolean, default: true },
        peer: { type: Boolean, default: false },
        summary: { type: Boolean, default: true },
      },
      wellness: {
        exercise: { type: Boolean, default: true },
        meditation: { type: Boolean, default: false },
        reading: { type: Boolean, default: true },
        music: { type: Boolean, default: true },
        walking: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = {
  User: mongoose.model("User", userSchema),
  FACULTIES,
  YEARS,
  SEMESTERS,
};
