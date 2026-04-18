const express = require("express");
const { JournalEntry } = require("../models/JournalEntry");
const { analyzeEmotion } = require("../services/moodAiService");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

function getAuthenticatedUserId(req) {
  return String(req.user._id);
}

function getLocalDayBounds(dateInput) {
  const date = new Date(dateInput);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function parseEntryDate(entryDate) {
  const now = new Date();

  if (!entryDate) {
    return now;
  }

  if (typeof entryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    const [year, month, day] = entryDate.split("-").map(Number);
    return new Date(
      year,
      month - 1,
      day,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );
  }

  const parsed = new Date(entryDate);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid entryDate.");
  }

  return parsed;
}

function normalizeTimeRange(input) {
  if (input === "30D") return "30D";
  if (input === "1Y") return "1Y";
  return "7D";
}

function normalizeEmotionKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

router.post("/entries", async (req, res) => {
  try {
    const { text, entryDate } = req.body;
    const userId = getAuthenticatedUserId(req);

    if (!text || !String(text).trim()) {
      return res.status(400).json({ status: "error", message: "text is required." });
    }

    const parsedDate = parseEntryDate(entryDate);

    if (parsedDate > new Date()) {
      return res.status(400).json({ status: "error", message: "Entry date cannot be in the future." });
    }

    const { start, end } = getLocalDayBounds(parsedDate);

    const existing = await JournalEntry.findOne({
      userId: String(userId),
      entryDate: { $gte: start, $lte: end },
    });

    if (existing) {
      return res.status(409).json({ status: "error", message: "An entry already exists for that date." });
    }

    const analysis = await analyzeEmotion(text);

    const entry = await JournalEntry.create({
      userId: String(userId),
      text: String(text).trim(),
      entryDate: parsedDate,
      emotion: analysis.emotion,
      emotionScores: new Map(Object.entries(analysis.emotionScores || {})),
      moodScore: analysis.moodScore,
      stressScore: analysis.stressScore,
      energyScore: analysis.energyScore,
      sentiment: analysis.sentiment,
      suggestions: analysis.suggestions || [],
    });

    return res.status(201).json({
      entryId: entry._id,
      status: "success",
      message: "Journal entry saved and analyzed.",
      entryDate: entry.entryDate,
      emotion: analysis.emotion,
      emotionScores: analysis.emotionScores,
      moodScore: analysis.moodScore,
      stressScore: analysis.stressScore,
      energyScore: analysis.energyScore,
      sentiment: analysis.sentiment,
      suggestions: analysis.suggestions,
    });
  } catch (error) {
    console.error("[moodTracker:submitEntry]", error);
    return res.status(500).json({ status: "error", message: error.message || "Failed to save entry." });
  }
});

router.put("/entries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = getAuthenticatedUserId(req);

    if (!text || !String(text).trim()) {
      return res.status(400).json({ status: "error", message: "text is required." });
    }

    const analysis = await analyzeEmotion(text);

    const updated = await JournalEntry.findOneAndUpdate(
      { _id: id, userId: String(userId) },
      {
        text: String(text).trim(),
        emotion: analysis.emotion,
        emotionScores: new Map(Object.entries(analysis.emotionScores || {})),
        moodScore: analysis.moodScore,
        stressScore: analysis.stressScore,
        energyScore: analysis.energyScore,
        sentiment: analysis.sentiment,
        suggestions: analysis.suggestions || [],
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ status: "error", message: "Entry not found." });
    }

    return res.json({
      entryId: updated._id,
      status: "success",
      message: "Journal entry updated securely.",
      emotion: updated.emotion,
      emotionScores: updated.emotionScores ? Object.fromEntries(updated.emotionScores) : {},
      moodScore: updated.moodScore,
      stressScore: updated.stressScore,
      energyScore: updated.energyScore,
      sentiment: updated.sentiment,
      suggestions: updated.suggestions || [],
    });
  } catch (error) {
    console.error("[moodTracker:updateEntry]", error);
    return res.status(500).json({ status: "error", message: error.message || "Failed to update entry." });
  }
});

router.delete("/entries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getAuthenticatedUserId(req);
    const deleted = await JournalEntry.findOneAndDelete({ _id: id, userId: String(userId) });

    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Entry not found." });
    }

    return res.json({ status: "success", message: "Journal entry deleted.", entryId: id });
  } catch (error) {
    console.error("[moodTracker:deleteEntry]", error);
    return res.status(500).json({ status: "error", message: error.message || "Failed to delete entry." });
  }
});

router.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    const result = await analyzeEmotion(text);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Failed to analyze." });
  }
});

router.get("/history", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const entries = await JournalEntry.find({ userId: String(userId) }).sort({ entryDate: -1 });

    return res.json(
      entries.map((entry) => ({
        entryId: entry._id,
        entryDate: entry.entryDate,
        moodScore: entry.moodScore,
        stressScore: entry.stressScore,
        energyScore: entry.energyScore,
        emotion: entry.emotion,
        emotionScores: entry.emotionScores ? Object.fromEntries(entry.emotionScores) : {},
        sentiment: entry.sentiment,
        summaryText: entry.summaryText,
        text: entry.text,
        suggestions: entry.suggestions || [],
      }))
    );
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Failed to load history." });
  }
});

router.get("/history/date/:entryDate", async (req, res) => {
  try {
    const { entryDate } = req.params;
    const userId = getAuthenticatedUserId(req);
    const parsedDate = parseEntryDate(entryDate);
    const { start, end } = getLocalDayBounds(parsedDate);

    const entries = await JournalEntry.find({
      userId: String(userId),
      entryDate: { $gte: start, $lte: end },
    }).sort({ createdAt: 1 });

    return res.json({
      entryDate,
      entries: entries.map((entry) => ({
        entryDate: entry.entryDate,
        text: entry.text,
        moodScore: entry.moodScore,
        stressScore: entry.stressScore,
        energyScore: entry.energyScore,
        sentiment: entry.sentiment,
        summaryText: entry.summaryText,
        suggestions: entry.suggestions || [],
      })),
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Failed to load entry details." });
  }
});

router.get("/weekly-summary", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);

    const entries = await JournalEntry.find({
      userId: String(userId),
      entryDate: { $gte: weekAgo },
    }).sort({ entryDate: 1 });

    if (!entries.length) {
      return res.json({ avgMood: 0, mostStressfulDay: null, mostEnergeticDay: null });
    }

    const totalMood = entries.reduce((sum, entry) => sum + entry.moodScore, 0);
    const stressByDay = {};
    const energyByDay = {};

    entries.forEach((entry) => {
      const day = new Date(entry.entryDate).toLocaleString("en-US", { weekday: "short" });
      stressByDay[day] = (stressByDay[day] || 0) + entry.stressScore;
      energyByDay[day] = (energyByDay[day] || 0) + entry.energyScore;
    });

    const mostStressfulDay = Object.entries(stressByDay).sort((a, b) => b[1] - a[1])[0][0];
    const mostEnergeticDay = Object.entries(energyByDay).sort((a, b) => b[1] - a[1])[0][0];

    return res.json({
      avgMood: Number((totalMood / entries.length).toFixed(1)),
      mostStressfulDay,
      mostEnergeticDay,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Failed to load weekly summary." });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const timeRange = normalizeTimeRange(req.query.timeRange);

    const now = new Date();
    const startDate = new Date();
    let groupBy = "day";

    if (timeRange === "7D") {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupBy = "day";
    } else if (timeRange === "30D") {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      groupBy = "date";
    } else {
      startDate.setMonth(now.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      groupBy = "month";
    }

    const filtered = await JournalEntry.find({
      userId: String(userId),
      entryDate: { $gte: startDate, $lte: now },
    }).sort({ entryDate: 1 });

    let avgMood = 0;
    let avgStress = 0;
    let avgEnergy = 0;

    if (filtered.length) {
      avgMood = filtered.reduce((sum, entry) => sum + entry.moodScore, 0) / filtered.length;
      avgStress = filtered.reduce((sum, entry) => sum + entry.stressScore, 0) / filtered.length;
      avgEnergy = filtered.reduce((sum, entry) => sum + entry.energyScore, 0) / filtered.length;
    }

    const emotionTotals = new Map();
    let emotionEntriesCount = 0;

    filtered.forEach((entry) => {
      const mapObject = entry.emotionScores ? Object.fromEntries(entry.emotionScores) : {};
      const scores = Object.entries(mapObject);

      if (!scores.length) {
        return;
      }

      emotionEntriesCount += 1;
      scores.forEach(([emotion, score]) => {
        const safeEmotion = normalizeEmotionKey(emotion);
        const safeScore = Number(score);

        if (!safeEmotion || !Number.isFinite(safeScore)) {
          return;
        }

        emotionTotals.set(safeEmotion, (emotionTotals.get(safeEmotion) || 0) + Math.max(0, safeScore));
      });
    });

    const emotionBreakdown = Array.from(emotionTotals.entries())
      .map(([emotion, total]) => ({
        emotion,
        score: emotionEntriesCount > 0 ? total / emotionEntriesCount : 0,
      }))
      .sort((a, b) => b.score - a.score);

    const emotionStats = Object.fromEntries(
      emotionBreakdown.map(({ emotion, score }) => [emotion, score])
    );

    const groups = {};

    if (timeRange === "7D") {
      for (let i = 0; i < 7; i += 1) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const label = date.toLocaleDateString("en-US", { weekday: "short" });
        groups[label] = { moodSum: 0, stressSum: 0, energySum: 0, count: 0, sortKey: date.getTime() };
      }
    } else if (timeRange === "30D") {
      for (let i = 0; i < 30; i += 1) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        groups[label] = { moodSum: 0, stressSum: 0, energySum: 0, count: 0, sortKey: date.getTime() };
      }
    } else {
      for (let i = 0; i < 12; i += 1) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);
        const label = date.toLocaleDateString("en-US", { month: "short" });
        groups[label] = { moodSum: 0, stressSum: 0, energySum: 0, count: 0, sortKey: date.getTime() };
      }
    }

    filtered.forEach((entry) => {
      const date = new Date(entry.entryDate);
      let label;

      if (groupBy === "day") {
        label = date.toLocaleDateString("en-US", { weekday: "short" });
      } else if (groupBy === "date") {
        label = `${date.getMonth() + 1}/${date.getDate()}`;
      } else {
        label = date.toLocaleDateString("en-US", { month: "short" });
      }

      if (groups[label]) {
        groups[label].moodSum += entry.moodScore;
        groups[label].stressSum += entry.stressScore;
        groups[label].energySum += entry.energyScore;
        groups[label].count += 1;
      }
    });

    const chartData = Object.entries(groups)
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .map(([label, data]) => ({
        day: label,
        mood: data.count > 0 ? Number((data.moodSum / data.count).toFixed(1)) : 0,
        stress: data.count > 0 ? Number((data.stressSum / data.count).toFixed(1)) : 0,
        energy: data.count > 0 ? Number((data.energySum / data.count).toFixed(1)) : 0,
      }));

    const recentWindow = new Date(now);
    recentWindow.setDate(now.getDate() - 30);
    const recentEntries = await JournalEntry.find({
      userId: String(userId),
      entryDate: { $gte: recentWindow },
    }).select("entryDate");

    const daySet = new Set(recentEntries.map((entry) => new Date(entry.entryDate).toDateString()));
    let streakCount = 0;

    for (let i = 0; i < 30; i += 1) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);

      if (daySet.has(day.toDateString())) {
        streakCount += 1;
      } else if (i > 0) {
        break;
      }
    }

    return res.json({
      stats: {
        avgMood: Number(avgMood.toFixed(1)),
        avgStress: Number(avgStress.toFixed(1)),
        avgEnergy: Number(avgEnergy.toFixed(1)),
      },
      emotionStats,
      emotionBreakdown,
      chartData,
      streakCount,
    });
  } catch (error) {
    console.error("[moodTracker:getDashboardStats]", error);
    return res.status(500).json({ status: "error", message: error.message || "Failed to load dashboard." });
  }
});

module.exports = router;
