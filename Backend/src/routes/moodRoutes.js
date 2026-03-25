const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { MoodLog } = require("../models/MoodLog");
const { createNotification } = require("../utils/notifications");

const router = express.Router();

const POSITIVE_WORDS = [
  "happy",
  "calm",
  "great",
  "good",
  "productive",
  "better",
  "relaxed",
  "proud",
  "focused",
  "motivated",
  "grateful",
  "excited",
];

const NEGATIVE_WORDS = [
  "stress",
  "stressed",
  "anxious",
  "overwhelmed",
  "tired",
  "exhausted",
  "sad",
  "upset",
  "burnout",
  "worried",
  "panic",
  "drained",
  "pressure",
];

function normalizeDate(input) {
  const date = input ? new Date(input) : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function validateMoodPayload(payload) {
  const errors = {};
  const moodValue = Number(payload.moodValue);
  const stressLevel = Number(payload.stressLevel);
  const energyLevel = Number(payload.energyLevel);

  if (!Number.isInteger(moodValue) || moodValue < 1 || moodValue > 5) {
    errors.moodValue = "Mood must be between 1 and 5.";
  }

  if (!Number.isInteger(stressLevel) || stressLevel < 1 || stressLevel > 10) {
    errors.stressLevel = "Stress level must be between 1 and 10.";
  }

  if (!Number.isInteger(energyLevel) || energyLevel < 1 || energyLevel > 10) {
    errors.energyLevel = "Energy level must be between 1 and 10.";
  }

  if (payload.note && payload.note.trim().length > 500) {
    errors.note = "Reflection must be 500 characters or less.";
  }

  const entryDate = normalizeDate(payload.entryDate);

  if (!entryDate) {
    errors.entryDate = "Enter a valid date.";
  }

  return {
    errors,
    values: {
      moodValue,
      stressLevel,
      energyLevel,
      note: payload.note?.trim() || "",
      entryDate,
    },
  };
}

function analyzeNote(note, moodValue, stressLevel, energyLevel) {
  const normalized = note.toLowerCase();
  const positiveHits = POSITIVE_WORDS.filter((word) => normalized.includes(word)).length;
  const negativeHits = NEGATIVE_WORDS.filter((word) => normalized.includes(word)).length;

  let sentiment = "neutral";

  if (negativeHits > positiveHits || stressLevel >= 8 || moodValue <= 2) {
    sentiment = "negative";
  } else if (positiveHits > negativeHits || (moodValue >= 4 && energyLevel >= 6)) {
    sentiment = "positive";
  }

  if (sentiment === "negative") {
    if (stressLevel >= 8) {
      return {
        sentiment,
        insight:
          "Your note suggests a high-stress day. Try a short study break, a 5-minute breathing reset, or splitting work into smaller tasks.",
      };
    }

    if (energyLevel <= 3) {
      return {
        sentiment,
        insight:
          "Your reflection points to low energy. A short walk, hydration break, or lighter task block may help you reset without overloading yourself.",
      };
    }

    return {
      sentiment,
      insight:
        "Your reflection sounds heavy today. Consider slowing the pace, checking your schedule, and giving yourself one small recovery activity.",
    };
  }

  if (sentiment === "positive") {
    return {
      sentiment,
      insight:
        "Your reflection shows positive momentum. Notice what supported this day so you can repeat that routine during busier weeks.",
    };
  }

  return {
    sentiment,
    insight:
      "Your reflection looks fairly balanced. Keeping track of routines, workload, and sleep can help you spot what shifts your mood over time.",
  };
}

function formatMoodLog(log) {
  return {
    id: log._id,
    studentId: log.studentId,
    entryDate: log.entryDate,
    moodValue: log.moodValue,
    stressLevel: log.stressLevel,
    energyLevel: log.energyLevel,
    note: log.note,
    sentiment: log.sentiment,
    insight: log.insight,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

function getTimeframeStart(timeframe) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days = timeframe === "month" ? 29 : 6;
  start.setUTCDate(start.getUTCDate() - days);
  return start;
}

function average(items, key) {
  if (!items.length) {
    return 0;
  }

  return Number(
    (items.reduce((sum, item) => sum + item[key], 0) / items.length).toFixed(1)
  );
}

function buildChartData(logs) {
  return logs.map((log) => {
    const date = new Date(log.entryDate);
    return {
      id: String(log._id),
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weekday: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      entryDate: log.entryDate,
      moodValue: log.moodValue,
      stressLevel: log.stressLevel,
      energyLevel: log.energyLevel,
      sentiment: log.sentiment,
    };
  });
}

function buildWeeklySummary(logs) {
  const lastSeven = logs.slice(-7);

  if (!lastSeven.length) {
    return {
      summary:
        "No entries yet this week. Start with one quick check-in to unlock mood trends and weekly insights.",
      mostStressfulDay: null,
      lowestEnergyDay: null,
    };
  }

  const mostStressfulDay = [...lastSeven].sort((a, b) => b.stressLevel - a.stressLevel)[0];
  const lowestEnergyDay = [...lastSeven].sort((a, b) => a.energyLevel - b.energyLevel)[0];
  const avgMood = average(lastSeven, "moodValue");
  const avgStress = average(lastSeven, "stressLevel");
  const avgEnergy = average(lastSeven, "energyLevel");

  let summary =
    "This week looks steady overall. Keep logging to make the pattern clearer.";

  if (avgStress >= 7) {
    summary =
      "Stress ran high this week. Consider lighter recovery blocks between study sessions and earlier planning for heavy days.";
  } else if (avgMood >= 4 && avgEnergy >= 6) {
    summary =
      "Your week trends positive. Energy and mood stayed fairly strong, which suggests your routine is supporting you well.";
  } else if (avgEnergy <= 4) {
    summary =
      "Energy dipped this week. Short breaks, hydration, and workload pacing may help reduce that drag across the day.";
  }

  return {
    summary,
    mostStressfulDay: formatMoodLog(mostStressfulDay),
    lowestEnergyDay: formatMoodLog(lowestEnergyDay),
  };
}

function buildEncouragement(logs) {
  if (!logs.length) {
    return "Start your first mood check-in today. Small daily logs make the weekly trends useful.";
  }

  let streak = 1;

  for (let index = logs.length - 1; index > 0; index -= 1) {
    const current = normalizeDate(logs[index].entryDate);
    const previous = normalizeDate(logs[index - 1].entryDate);
    const diffDays = Math.round((current - previous) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      break;
    }
  }

  if (streak >= 7) {
    return `You have logged ${streak} days in a row. That consistency makes your insights far more reliable.`;
  }

  if (streak >= 3) {
    return `You are on a ${streak}-day logging streak. Keep it going for a stronger weekly summary.`;
  }

  return "You logged recently. A few more consecutive check-ins will start revealing clearer mood patterns.";
}

function buildInsightCards(logs) {
  if (!logs.length) {
    return [];
  }

  const cards = [];
  const lastSeven = logs.slice(-7);
  const avgMood = average(lastSeven, "moodValue");
  const avgStress = average(lastSeven, "stressLevel");
  const avgEnergy = average(lastSeven, "energyLevel");
  const mostStressfulDay = [...lastSeven].sort((a, b) => b.stressLevel - a.stressLevel)[0];
  const lowestEnergyDay = [...lastSeven].sort((a, b) => a.energyLevel - b.energyLevel)[0];
  const recentNoteLogs = logs.filter((log) => log.note).slice(-2).reverse();

  if (avgStress >= 7) {
    cards.push({
      id: "trend-high-stress",
      sentiment: "negative",
      title: "High Stress Pattern",
      message:
        "Your recent logs show elevated stress across the week. Consider lighter task blocks and short resets before heavy study periods.",
      entryDate: mostStressfulDay.entryDate,
    });
  }

  if (avgEnergy <= 4) {
    cards.push({
      id: "trend-low-energy",
      sentiment: "neutral",
      title: "Low Energy Trend",
      message:
        "Your energy levels have been consistently low. A steadier workload, hydration breaks, and earlier recovery time may help stabilize that pattern.",
      entryDate: lowestEnergyDay.entryDate,
    });
  }

  if (avgMood >= 4 && avgEnergy >= 6) {
    cards.push({
      id: "trend-positive-week",
      sentiment: "positive",
      title: "Positive Weekly Trend",
      message:
        "Your recent entries show strong mood and energy together. This usually points to a routine that is working well for you.",
      entryDate: lastSeven[lastSeven.length - 1].entryDate,
    });
  }

  recentNoteLogs.forEach((log) => {
    cards.push({
      id: String(log._id),
      sentiment: log.sentiment,
      title:
        log.sentiment === "positive"
          ? "Reflection Insight"
          : log.sentiment === "negative"
            ? "Stress Signal"
            : "Balanced Reflection",
      message: log.insight,
      entryDate: log.entryDate,
    });
  });

  if (!cards.length) {
    cards.push({
      id: "trend-steady",
      sentiment: "neutral",
      title: "Steady Pattern",
      message:
        "Your recent mood data looks fairly balanced. Keep logging consistently to surface clearer emotional patterns over time.",
      entryDate: lastSeven[lastSeven.length - 1].entryDate,
    });
  }

  return cards.slice(0, 4);
}

function buildOverview(logs, timeframe) {
  const filteredLogs = logs.filter((log) => log.entryDate >= getTimeframeStart(timeframe));
  const chartData = buildChartData(filteredLogs);
  const highestMoodDay = filteredLogs.length
    ? [...filteredLogs].sort((a, b) => b.moodValue - a.moodValue || a.stressLevel - b.stressLevel)[0]
    : null;
  const lowestMoodDay = filteredLogs.length
    ? [...filteredLogs].sort((a, b) => a.moodValue - b.moodValue || b.stressLevel - a.stressLevel)[0]
    : null;

  return {
    logs: logs.map(formatMoodLog).reverse(),
    chartData,
    stats: {
      totalEntries: logs.length,
      averageMood: average(filteredLogs, "moodValue"),
      averageStress: average(filteredLogs, "stressLevel"),
      averageEnergy: average(filteredLogs, "energyLevel"),
      highestMoodDay: highestMoodDay ? formatMoodLog(highestMoodDay) : null,
      lowestMoodDay: lowestMoodDay ? formatMoodLog(lowestMoodDay) : null,
    },
    weeklySummary: buildWeeklySummary(logs),
    encouragementMessage: buildEncouragement(logs),
    insightCards: buildInsightCards(logs),
  };
}

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const timeframe = req.query.timeframe === "month" ? "month" : "week";
    const logs = await MoodLog.find({ user: req.user._id }).sort({ entryDate: 1, createdAt: 1 });

    return res.json(buildOverview(logs, timeframe));
  } catch (error) {
    console.error("Fetch moods error:", error);
    return res.status(500).json({ message: "Server error while loading mood history." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { errors, values } = validateMoodPayload(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted mood fields.",
        errors,
      });
    }

    const existingLog = await MoodLog.findOne({
      user: req.user._id,
      entryDate: values.entryDate,
    });

    if (existingLog) {
      return res.status(409).json({
        message: "A mood log already exists for that date. Edit the existing entry instead.",
        errors: {
          entryDate: "A log already exists for this date.",
        },
        existingLog: formatMoodLog(existingLog),
      });
    }

    const analysis = analyzeNote(
      values.note,
      values.moodValue,
      values.stressLevel,
      values.energyLevel
    );

    const log = await MoodLog.create({
      user: req.user._id,
      studentId: req.user.studentId,
      ...values,
      sentiment: analysis.sentiment,
      insight: analysis.insight,
    });

    await createNotification({
      user: req.user._id,
      type: "mood_logged",
      module: "mood",
      title: "Mood logged",
      message: `Your ${values.entryDate.toISOString().slice(0, 10)} mood check-in was saved.`,
      linkPage: "mood",
    });

    return res.status(201).json({
      message: "Mood log created successfully.",
      log: formatMoodLog(log),
    });
  } catch (error) {
    console.error("Create mood error:", error);
    return res.status(500).json({ message: "Server error while saving mood log." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { errors, values } = validateMoodPayload(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted mood fields.",
        errors,
      });
    }

    const log = await MoodLog.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!log) {
      return res.status(404).json({ message: "Mood log not found." });
    }

    const duplicateForDate = await MoodLog.findOne({
      _id: { $ne: log._id },
      user: req.user._id,
      entryDate: values.entryDate,
    });

    if (duplicateForDate) {
      return res.status(409).json({
        message: "Another mood log already exists for that date.",
        errors: {
          entryDate: "Choose a different date or edit the existing record for that day.",
        },
      });
    }

    const analysis = analyzeNote(
      values.note,
      values.moodValue,
      values.stressLevel,
      values.energyLevel
    );

    Object.assign(log, values, {
      sentiment: analysis.sentiment,
      insight: analysis.insight,
    });

    await log.save();

    await createNotification({
      user: req.user._id,
      type: "mood_updated",
      module: "mood",
      title: "Mood updated",
      message: `Your mood log for ${values.entryDate.toISOString().slice(0, 10)} was updated.`,
      linkPage: "mood",
    });

    return res.json({
      message: "Mood log updated successfully.",
      log: formatMoodLog(log),
    });
  } catch (error) {
    console.error("Update mood error:", error);
    return res.status(500).json({ message: "Server error while updating mood log." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const log = await MoodLog.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!log) {
      return res.status(404).json({ message: "Mood log not found." });
    }

    await createNotification({
      user: req.user._id,
      type: "mood_deleted",
      module: "mood",
      title: "Mood deleted",
      message: "A mood entry was removed from your history.",
      linkPage: "mood",
    });

    return res.json({ message: "Mood log deleted successfully." });
  } catch (error) {
    console.error("Delete mood error:", error);
    return res.status(500).json({ message: "Server error while deleting mood log." });
  }
});

module.exports = router;
