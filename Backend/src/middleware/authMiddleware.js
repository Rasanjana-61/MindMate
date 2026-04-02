const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { getCookieName } = require("../utils/auth");
const { syncAcademicProgress } = require("../utils/academicProgress");

async function protect(req, res, next) {
  const cookieToken = req.cookies?.[getCookieName()];
  const authHeader = req.headers.authorization;
  const headerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: "Not authorized." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    // Check if user account is deactivated
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact admin for assistance." });
    }

    await syncAcademicProgress(user);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = { protect };
