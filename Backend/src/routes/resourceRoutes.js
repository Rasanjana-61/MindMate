const fs = require("fs");
const path = require("path");
const express = require("express");
const mammoth = require("mammoth");
const PDFDocument = require("pdfkit");
const { PDFParse } = require("pdf-parse");
const { protect } = require("../middleware/authMiddleware");
const { uploadResourceFile } = require("../middleware/uploadMiddleware");
const { Resource } = require("../models/Resource");
const { createNotification } = require("../utils/notifications");

const router = express.Router();

function formatResource(resource) {
  return {
    id: resource._id,
    originalFileName: resource.originalFileName,
    mimeType: resource.mimeType,
    subject: resource.subject,
    studentId: resource.studentId,
    faculty: resource.faculty,
    year: resource.year,
    semester: resource.semester,
    resourceType: resource.resourceType,
    description: resource.description,
    thumbnailUrl: resource.thumbnailUrl,
    status: resource.status,
    summary: resource.summary,
    keyPoints: resource.keyPoints,
    definitions: resource.definitions,
    keywords: resource.keywords,
    tags: resource.tags,
    processingStatus: resource.processingStatus,
    errorMessage: resource.errorMessage,
    userId: resource.user,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };
}

async function extractTextFromFile(filePath, extension) {
  if (extension === ".txt") {
    return fs.promises.readFile(filePath, "utf-8");
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (extension === ".pdf") {
    const buffer = await fs.promises.readFile(filePath);
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error("Unsupported file format.");
}

function normalizeSummaryResponse(data) {
  return {
    summary: String(data.summary || "").trim(),
    keyPoints: Array.isArray(data.keyPoints)
      ? data.keyPoints.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
      : [],
    definitions: Array.isArray(data.definitions)
      ? data.definitions
          .map((item) => ({
            term: String(item.term || "").trim(),
            definition: String(item.definition || "").trim(),
          }))
          .filter((item) => item.term && item.definition)
          .slice(0, 8)
      : [],
    keywords: Array.isArray(data.keywords)
      ? data.keywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 12)
      : [],
    tags: Array.isArray(data.tags)
      ? data.tags.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
      : [],
  };
}

function extractJsonFromText(text) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI response was not valid JSON.");
    }

    return JSON.parse(match[0]);
  }
}

async function generateGeminiSummary(extractedText, subject) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = `
You are an academic study assistant.
Read the study material below and return only valid JSON with this exact structure:
{
  "summary": "2-4 sentence concise exam-focused summary",
  "keyPoints": ["bullet 1", "bullet 2"],
  "definitions": [{"term": "word", "definition": "meaning"}],
  "keywords": ["keyword1", "keyword2"],
  "tags": ["tag1", "tag2"]
}

Rules:
- Keep the summary concise and useful for revision.
- Provide 4 to 8 key points.
- Provide 3 to 8 definitions only when clearly present or inferable from the content.
- Provide 5 to 12 keywords.
- Provide 2 to 5 topic tags.
- Do not include markdown fences.
- If the provided subject is useful, incorporate it in the framing.

Subject: ${subject || "Not specified"}

Study Material:
${extractedText.slice(0, 30000)}
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini request failed.");
  }

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim() || "";

  if (!text) {
    throw new Error("Gemini returned an empty summary.");
  }

  return normalizeSummaryResponse(extractJsonFromText(text));
}

function validateSubject(subject) {
  if (!subject) {
    return "";
  }

  return String(subject).trim().slice(0, 100);
}

function applySummary(resource, aiSummary, subject) {
  resource.subject = subject || aiSummary.tags[0] || resource.subject || "";
  resource.summary = aiSummary.summary;
  resource.keyPoints = aiSummary.keyPoints;
  resource.definitions = aiSummary.definitions;
  resource.keywords = aiSummary.keywords;
  resource.tags = aiSummary.tags;
  resource.processingStatus = "completed";
  resource.errorMessage = "";
}

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const type = req.query.type?.trim(); // video, audio, pdf, ebook
    
    let filter = {};

    if (req.user.role === "admin") {
      // Admins see everything
      filter = {};
    } else {
      // Students see approved resources for their batch, 
      // AND their own resources (regardless of status)
      filter = {
        $or: [
          { 
            faculty: req.user.faculty, 
            year: req.user.year, 
            semester: req.user.semester,
            status: "approved" 
          },
          { user: req.user._id }
        ]
      };
    }

    if (search) {
      const searchFilter = {
        $or: [
          { originalFileName: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $elemMatch: { $regex: search, $options: "i" } } },
          { keywords: { $elemMatch: { $regex: search, $options: "i" } } },
        ]
      };
      
      // Merge search filter with existing profile filter
      if (Object.keys(filter).length === 0) {
        filter = searchFilter;
      } else {
        filter = { $and: [filter, searchFilter] };
      }
    }

    if (type) {
      filter.resourceType = type;
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 });

    return res.json({
      resources: resources.map(formatResource),
    });
  } catch (error) {
    console.error("Fetch resources error:", error);
    return res.status(500).json({ message: "Server error while loading resources." });
  }
});

router.post(
  "/",
  uploadResourceFile.single("file"),
  async (req, res) => {
    let filePath = "";

    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please upload a file." });
      }

      filePath = req.file.path;
      const extension = path.extname(req.file.originalname).toLowerCase();
      
      let extractedText = "";
      let aiSummary = {
        summary: "",
        keyPoints: [],
        definitions: [],
        keywords: [],
        tags: [],
      };

      const resourceType = req.body.resourceType || "pdf";
      const faculty = req.body.faculty || req.user.faculty;
      const year = req.body.year || req.user.year;
      const semester = req.body.semester || req.user.semester;
      const description = req.body.description || "";
      const subject = validateSubject(req.body.subject);

      // Only attempt text extraction for text-based files
      if ([".txt", ".docx", ".pdf"].includes(extension)) {
        try {
          extractedText = (await extractTextFromFile(filePath, extension)).trim();
          if (extractedText) {
            aiSummary = await generateGeminiSummary(extractedText, subject);
          }
        } catch (err) {
          console.warn("AI generation failed or file not readable, saving without AI processing:", err.message);
        }
      }

      const resource = await Resource.create({
        user: req.user._id,
        studentId: req.user.studentId,
        faculty,
        year,
        semester,
        resourceType,
        description,
        originalFileName: req.file.originalname,
        storedFilePath: req.file.path,
        mimeType: req.file.mimetype || "application/octet-stream",
        subject,
        extractedText: extractedText || "N/A",
        ...aiSummary,
        processingStatus: extractedText ? "completed" : "pending",
      });

      await createNotification({
        user: req.user._id,
        type: "resource_ready",
        module: "resources",
        title: "Resource uploaded",
        message: `${resource.originalFileName} is now available in the hub.`,
        linkPage: "resources",
        resource: resource._id,
      });

      return res.status(201).json({
        message: "Resource uploaded successfully.",
        resource: formatResource(resource),
      });
    } catch (error) {
      console.error("Create resource error:", error);

      if (filePath) {
        fs.promises.unlink(filePath).catch(() => {});
      }

      return res.status(500).json({
        message: error.message || "Server error while processing resource.",
      });
    }
  }
);

router.get("/:id", async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "admin") {
      query.user = req.user._id;
    }

    const resource = await Resource.findOne(query);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found or unauthorized." });
    }

    return res.json({ resource: formatResource(resource) });
  } catch (error) {
    console.error("Fetch resource error:", error);
    return res.status(500).json({ message: "Server error while loading resource." });
  }
});

router.put("/:id/regenerate", async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, user: req.user._id });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    const subject = validateSubject(req.body.subject) || resource.subject;
    const aiSummary = await generateGeminiSummary(resource.extractedText, subject);

    applySummary(resource, aiSummary, subject);
    await resource.save();

    await createNotification({
      user: req.user._id,
      type: "resource_regenerated",
      module: "resources",
      title: "Summary regenerated",
      message: `${resource.originalFileName} was regenerated with AI.`,
      linkPage: "resources",
      resource: resource._id,
    });

    return res.json({
      message: "Summary regenerated successfully.",
      resource: formatResource(resource),
    });
  } catch (error) {
    console.error("Regenerate resource error:", error);
    return res.status(500).json({ message: error.message || "Server error while regenerating summary." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "admin") {
      query.user = req.user._id;
    }

    const resource = await Resource.findOneAndDelete(query);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found or unauthorized." });
    }

    fs.promises.unlink(resource.storedFilePath).catch(() => {});

    await createNotification({
      user: resource.user, // Notify the original owner!
      type: "resource_deleted",
      module: "resources",
      title: "Resource removed",
      message: `${resource.originalFileName} was removed from the hub.`,
      linkPage: "resources",
    });

    return res.json({ message: "Resource deleted successfully." });
  } catch (error) {
    console.error("Delete resource error:", error);
    return res.status(500).json({ message: "Server error while deleting resource." });
  }
});

router.get("/:id/download", async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "admin") {
      query.user = req.user._id;
    }

    const resource = await Resource.findOne(query);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found or unauthorized." });
    }

    const doc = new PDFDocument({ margin: 50 });
    const safeName = resource.originalFileName.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]+/gi, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${safeName}-summary.pdf\"`);

    doc.pipe(res);
    doc.fontSize(20).text(resource.originalFileName);
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#4b5563").text(`Subject: ${resource.subject || "Not specified"}`);
    doc.text(`Uploaded: ${new Date(resource.createdAt).toLocaleString("en-US")}`);
    doc.moveDown();

    doc.fillColor("#111827").fontSize(16).text("Summary");
    doc.moveDown(0.4);
    doc.fontSize(11).text(resource.summary || "No summary available.");
    doc.moveDown();

    doc.fontSize(16).text("Key Points");
    doc.moveDown(0.4);
    resource.keyPoints.forEach((point) => {
      doc.fontSize(11).text(`• ${point}`);
      doc.moveDown(0.2);
    });

    doc.moveDown();
    doc.fontSize(16).text("Definitions");
    doc.moveDown(0.4);
    resource.definitions.forEach((item) => {
      doc.fontSize(11).text(`${item.term}: ${item.definition}`);
      doc.moveDown(0.2);
    });

    doc.moveDown();
    doc.fontSize(16).text("Keywords");
    doc.moveDown(0.4);
    doc.fontSize(11).text(resource.keywords.join(", ") || "None");

    doc.moveDown();
    doc.fontSize(16).text("Tags");
    doc.moveDown(0.4);
    doc.fontSize(11).text(resource.tags.join(", ") || "None");
    doc.end();
  } catch (error) {
    console.error("Download resource PDF error:", error);
    return res.status(500).json({ message: "Server error while generating PDF." });
  }
});

module.exports = router;
