const express = require("express");
const multer = require("multer");
const { protect } = require("../../middleware/authMiddleware");
const summarizerController = require("./summarizerController");

const router = express.Router();

// Multer configuration for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// All routes are protected
router.use(protect);

/**
 * @route POST /api/summarizer/summarize
 * @desc Unified summarization endpoint (Text, Video, or File via multer)
 * @access Private
 */
router.post("/summarize", upload.single("file"), summarizerController.summarize);

/**
 * @route GET /api/summarizer/video/transcript
 * @desc Fetch YouTube video transcript
 * @access Private
 */
router.get("/video/transcript", summarizerController.getVideoTranscript);

module.exports = router;
