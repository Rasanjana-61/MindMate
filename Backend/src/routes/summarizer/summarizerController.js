const TranscriptLoader = require("../../services/TranscriptLoader");
const GeminiService = require("../../services/GeminiService");
const { PDFParse } = require("pdf-parse");
//const pdf = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * GET /api/summarizer/video/transcript
 * Fetch the transcript for a YouTube video
 */
const getVideoTranscript = async (req, res) => {
  const { videoLink } = req.query;
  if (!videoLink) {
    return res.status(400).json({ success: false, message: "Video link is required." });
  }

  try {
    const transcript = await TranscriptLoader.load(videoLink);
    return res.json({ success: true, transcript });
  } catch (error) {
    console.error("Transcript Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch transcript." });
  }
};

/**
 * POST /api/summarizer/summarize
 * Unified summarization endpoint for Video, Text, and File
 */
const summarize = async (req, res) => {
  try {
    const { type, content, language = "English" } = req.body;

    if (type === "video") {
      const summary = await GeminiService.generateSummary(content); // content is transcript text
      return res.json({ success: true, summary });
    }

    if (type === "text") {
      const summary = await GeminiService.summarizeGeneralText(content, language);
      return res.json({ success: true, summary });
    }

    if (type === "file") {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
      }

      let extractedText = "";
      const fileBuffer = req.file.buffer;
      const fileMimeType = req.file.mimetype;

      if (fileMimeType === "application/pdf") {
        //const data = await pdf(fileBuffer);
        //extractedText = data.text;
        const parser = new PDFParse({ data: fileBuffer });
        try {
          const data = await parser.getText();
          extractedText = data.text;
        } finally {
          await parser.destroy();
        }
      } else if (fileMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const data = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = data.value;
      } else {
        return res.status(400).json({ success: false, message: "Unsupported file type." });
      }

      const summary = await GeminiService.summarizeGeneralText(extractedText, language);
      return res.json({ success: true, summary });
    }

    return res.status(400).json({ success: false, message: "Invalid summarization type." });
  } catch (error) {
    console.error("Summarizer Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate summary.",
    });
  }
};

module.exports = {
  getVideoTranscript,
  summarize,
};
