import 'dotenv/config';
import dns from "dns";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import journalRoutes from "./routes/journalRoutes.js";

// Force Node.js to use Google DNS to avoid SRV lookup failures with IPv6 DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MindMate backend is running!");
});

// API routes
app.use("/api", journalRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4, helps with some DNS/SRV issues
  })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
