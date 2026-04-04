const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");
const path = require("path");
const { Server } = require("socket.io");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const focusRoutes = require("./routes/focusRoutes");
const moodRoutes = require("./routes/moodRoutes");
const peerRoutes = require("./routes/peerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const adminRoutes = require("./routes/adminRoutes");
const moodTrackerRoutes = require("./routes/moodTrackerRoutes");
const summarizerRoutes = require("./routes/summarizer/summarizerRoutes");
const { setIO } = require("./utils/socket");

dotenv.config();

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const LOCALHOST_ORIGIN = /^http:\/\/localhost:\d+$/;

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, LOCALHOST_ORIGIN],
    credentials: true,
  },
});

setIO(io);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === FRONTEND_URL || LOCALHOST_ORIGIN.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/peer", peerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/summarizer", summarizerRoutes);
app.use("/api", moodTrackerRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Not authorized."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
  });

  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Startup error:", error);
  process.exit(1);
});
