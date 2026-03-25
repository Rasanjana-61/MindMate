const express = require("express");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");
const { uploadProfileImage } = require("../middleware/uploadMiddleware");
const { User, FACULTIES, YEARS, SEMESTERS } = require("../models/User");
const {
  clearAuthCookie,
  generateToken,
  sanitizeUser,
} = require("../utils/auth");
const { syncAcademicProgress } = require("../utils/academicProgress");

const router = express.Router();

function validateRegistrationInput(payload) {
  const errors = {};

  if (!payload.studentId?.trim()) {
    errors.studentId = "Student ID is required.";
  }

  if (!payload.email?.trim()) {
    errors.email = "University email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!payload.password) {
    errors.password = "Password is required.";
  } else if (payload.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (payload.password !== payload.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!FACULTIES.includes(payload.faculty)) {
    errors.faculty = "Select a valid faculty.";
  }

  if (!YEARS.includes(payload.year)) {
    errors.year = "Select a valid academic year.";
  }

  if (!SEMESTERS.includes(payload.semester)) {
    errors.semester = "Select a valid semester.";
  }

  return errors;
}

function validateProfileUpdate(payload) {
  const errors = {};

  if (!payload.fullName?.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (payload.phone && !/^[0-9+\-\s()]{7,20}$/.test(payload.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (payload.bio && payload.bio.length > 300) {
    errors.bio = "Bio must be 300 characters or less.";
  }

  if (payload.preferences) {
    const { focusDuration, breakDuration, dailyGoal } = payload.preferences;

    if (focusDuration && !["25", "30", "45", "60"].includes(focusDuration)) {
      errors.focusDuration = "Select a valid focus duration.";
    }

    if (breakDuration && !["5", "10", "15"].includes(breakDuration)) {
      errors.breakDuration = "Select a valid break duration.";
    }

    if (
      dailyGoal !== undefined &&
      (Number.isNaN(Number(dailyGoal)) || Number(dailyGoal) < 1 || Number(dailyGoal) > 10)
    ) {
      errors.dailyGoal = "Daily goal must be between 1 and 10 hours.";
    }
  }

  return errors;
}

router.post("/register", async (req, res) => {
  try {
    const errors = validateRegistrationInput(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted fields.",
        errors,
      });
    }

    const email = req.body.email.trim().toLowerCase();
    const studentId = req.body.studentId.trim().toUpperCase();

    const existingUser = await User.findOne({
      $or: [{ email }, { studentId }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "studentId";
      return res.status(409).json({
        message: "An account already exists with those details.",
        errors: {
          [field]:
            field === "email"
              ? "That email is already registered."
              : "That student ID is already registered.",
        },
      });
    }

    const user = await User.create({
      fullName: req.body.fullName?.trim() || studentId,
      studentId,
      email,
      password: req.body.password,
      faculty: req.body.faculty,
      year: req.body.year,
      semester: req.body.semester,
      bio: req.body.bio?.trim() || '',
      role: "Student",
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error during registration." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password. Please try again.",
      });
    }

    await syncAcademicProgress(user);

    const token = generateToken(user._id);

    return res.json({
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login." });
  }
});

router.get("/me", protect, async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Logged out successfully." });
});

router.put("/profile", protect, async (req, res) => {
  try {
    const errors = validateProfileUpdate(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted profile fields.",
        errors,
      });
    }

    const currentPreferences = req.user.preferences || {};
    const currentNotifications = currentPreferences.notifications || {};
    const currentWellness = currentPreferences.wellness || {};

    req.user.fullName = req.body.fullName.trim();
    req.user.phone = req.body.phone?.trim() || "";
    req.user.bio = req.body.bio?.trim() || "";

    req.user.preferences = {
      ...currentPreferences,
      ...(req.body.preferences || {}),
      dailyGoal:
        req.body.preferences?.dailyGoal !== undefined
          ? Number(req.body.preferences.dailyGoal)
          : currentPreferences.dailyGoal,
      notifications: {
        ...currentNotifications,
        ...(req.body.preferences?.notifications || {}),
      },
      wellness: {
        ...currentWellness,
        ...(req.body.preferences?.wellness || {}),
      },
    };

    await req.user.save();

    return res.json({
      message: "Profile updated successfully.",
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Server error while updating profile." });
  }
});

router.put("/profile/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userWithPassword = await User.findById(req.user._id);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required.",
      });
    }

    if (!userWithPassword || !(await userWithPassword.comparePassword(currentPassword))) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match.",
      });
    }

    userWithPassword.password = newPassword;
    await userWithPassword.save();

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Password update error:", error);
    return res.status(500).json({ message: "Server error while updating password." });
  }
});

router.post(
  "/profile/avatar",
  protect,
  uploadProfileImage.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please choose an image file." });
      }

      req.user.avatarUrl = `/uploads/profile-images/${path.basename(req.file.path)}`;
      await req.user.save();

      return res.json({
        message: "Profile image updated successfully.",
        user: sanitizeUser(req.user),
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      return res.status(500).json({ message: "Server error while uploading image." });
    }
  }
);

module.exports = router;
