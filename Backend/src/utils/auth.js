const jwt = require("jsonwebtoken");

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function getCookieName() {
  return process.env.COOKIE_NAME || "studentwell_token";
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function setAuthCookie(res, token) {
  res.cookie(getCookieName(), token, getCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(getCookieName(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    studentId: user.studentId,
    email: user.email,
    faculty: user.faculty,
    year: user.year,
    semester: user.semester,
    role: user.role,
    isActive: user.isActive,
    phone: user.phone,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    preferences: user.preferences,
    createdAt: user.createdAt,
  };
}

module.exports = {
  clearAuthCookie,
  generateToken,
  sanitizeUser,
  setAuthCookie,
  getCookieName,
};
