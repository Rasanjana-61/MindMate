import JournalEntry from "../models/JournalEntry.model.js";
import { analyzeEmotion } from "../services/aiService.js";

// 1. Submit Journal Entry
export async function submitEntry(req, res) {
  try {
    const { userId, text } = req.body;
    const aiResult = await analyzeEmotion(text);
    const entry = new JournalEntry({
      userId,
      text,
      entryDate: new Date(),
      emotion: aiResult.emotion,
      emotionScores: new Map(Object.entries(aiResult.emotionScores)),
      moodScore: aiResult.moodScore,
      stressScore: aiResult.stressScore,
      energyScore: aiResult.energyScore,
      suggestions: aiResult.suggestions,
    });
    await entry.save();
    res.json({
      entryId: entry._id,
      status: "success",
      message: "Journal entry saved and analyzed.",
      emotion: aiResult.emotion,
      emotionScores: aiResult.emotionScores,
      moodScore: aiResult.moodScore,
      stressScore: aiResult.stressScore,
      energyScore: aiResult.energyScore,
      suggestions: aiResult.suggestions,
    });
  } catch (err) {
    console.error("[submitEntry] Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

// 2. Analyze Text (AI)
export async function analyzeTextAPI(req, res) {
  try {
    const { text } = req.body;
    const result = await analyzeEmotion(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

// 3. Get Dashboard Stats
export async function getDashboardStats(req, res) {
  try {
    const { userId } = req.params;
    const { timeRange = '7D' } = req.query;

    const now = new Date();
    let startDate = new Date();
    let groupBy = 'day';

    if (timeRange === '7D') {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'day';
    } else if (timeRange === '30D') {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'date';
    } else if (timeRange === '1Y') {
      startDate.setMonth(now.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'month';
    }

    // Fetch all entries from startDate to now for the stats
    const filtered = await JournalEntry.find({ 
      userId, 
      entryDate: { $gte: startDate, $lte: now } 
    }).sort({ entryDate: 1 });

    let avgMood = 0, avgStress = 0, avgEnergy = 0;
    if (filtered.length > 0) {
      avgMood = filtered.reduce((acc, e) => acc + e.moodScore, 0) / filtered.length;
      avgStress = filtered.reduce((acc, e) => acc + e.stressScore, 0) / filtered.length;
      avgEnergy = filtered.reduce((acc, e) => acc + e.energyScore, 0) / filtered.length;
    }

    // Emotion Stats are ALWAYS based on the last 7 days (as per existing spec)
    const weeklyStartDate = new Date(now);
    weeklyStartDate.setDate(now.getDate() - 6);
    weeklyStartDate.setHours(0, 0, 0, 0);

    const weeklyEntries = await JournalEntry.find({
      userId,
      entryDate: { $gte: weeklyStartDate, $lte: now }
    });

    const EMOTION_KEYS = ["joy", "anger", "disgust", "fear", "sadness", "surprise", "neutral"];
    let emotionTotals = { joy: 0, anger: 0, disgust: 0, fear: 0, sadness: 0, surprise: 0, neutral: 0 };
    let emotionEntriesCount = 0;

    weeklyEntries.forEach((e) => {
      // Mongoose Map check
      if (e.emotionScores && e.emotionScores.size > 0) {
        emotionEntriesCount++;
        const scoresObj = Object.fromEntries(e.emotionScores);
        EMOTION_KEYS.forEach(key => {
          emotionTotals[key] += scoresObj[key] || 0;
        });
      }
    });

    const emotionStats = {};
    EMOTION_KEYS.forEach(key => {
      emotionStats[key] = emotionEntriesCount > 0 ? (emotionTotals[key] / emotionEntriesCount) : 0;
    });

    // Chart Data Groupings
    const groups = {};

    if (timeRange === '7D') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        groups[label] = { moodSum: 0, stressSum: 0, energySum: 0, count: 0, sortKey: d.getTime() };
      }
    } else if (timeRange === '30D') {
      for (let i = 0; i < 30; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        groups[label] = { moodSum: 0, stressSum: 0, energySum: 0, count: 0, sortKey: d.getTime() };
      }
    } else if (timeRange === '1Y') {
      for (let i = 0; i < 12; i++) {
        const d = new Date(startDate);
        d.setMonth(startDate.getMonth() + i);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        groups[label] = { moodSum: 0, stressSum: 0, energySum: 0, count: 0, sortKey: d.getTime() };
      }
    }

    filtered.forEach((e) => {
      const d = new Date(e.entryDate);
      let label = '';
      if (groupBy === 'day') label = d.toLocaleDateString('en-US', { weekday: 'short' });
      else if (groupBy === 'date') label = `${d.getMonth() + 1}/${d.getDate()}`;
      else if (groupBy === 'month') label = d.toLocaleDateString('en-US', { month: 'short' });

      if (groups[label]) {
        groups[label].moodSum += e.moodScore;
        groups[label].stressSum += e.stressScore;
        groups[label].energySum += e.energyScore;
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

    // Streak Calculation (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const recentEntries = await JournalEntry.find({ userId, entryDate: { $gte: thirtyDaysAgo } }, 'entryDate');
    
    const dateSet = new Set(recentEntries.map((e) => new Date(e.entryDate).toDateString()));
    let streakCount = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dateSet.has(d.toDateString())) streakCount++;
      else if (i > 0) break;
    }

    res.json({
      stats: {
        avgMood: Number(avgMood.toFixed(1)),
        avgStress: Number(avgStress.toFixed(1)),
        avgEnergy: Number(avgEnergy.toFixed(1)),
      },
      emotionStats,
      chartData,
      streakCount
    });

  } catch (err) {
    console.error("[getDashboardStats] Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

// 4. Get Mood History
export async function getMoodHistory(req, res) {
  try {
    const { userId } = req.params;
    const entries = await JournalEntry.find({ userId }).sort({ entryDate: -1 });
    res.json(entries.map(entry => ({
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
      suggestions: entry.suggestions ?? [],
    })));
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

// 5. Get Entry Details by Date
export async function getEntryDetailsByDate(req, res) {
  try {
    const { userId, entryDate } = req.params;
    const entries = await JournalEntry.find({ userId, entryDate: new Date(entryDate) });
    res.json({
      entryDate,
      entries: entries.map(entry => ({
        text: entry.text,
        moodScore: entry.moodScore,
        stressScore: entry.stressScore,
        energyScore: entry.energyScore,
        sentiment: entry.sentiment,
        summaryText: entry.summaryText,
        suggestions: entry.suggestions
      }))
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

// 6. Get Weekly Summary
export async function getWeeklySummary(req, res) {
  try {
    const { userId } = req.params;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const entries = await JournalEntry.find({ userId, entryDate: { $gte: weekAgo } });
    if (!entries.length) return res.json({ avgMood: 0, mostStressfulDay: null, mostEnergeticDay: null });
    let totalMood = 0;
    let stressByDay = {}, energyByDay = {};
    entries.forEach(entry => {
      const day = new Date(entry.entryDate).toLocaleString("en-US", { weekday: "short" });
      totalMood += entry.moodScore;
      stressByDay[day] = (stressByDay[day] || 0) + entry.stressScore;
      energyByDay[day] = (energyByDay[day] || 0) + entry.energyScore;
    });
    const mostStressfulDay = Object.entries(stressByDay).sort((a, b) => b[1] - a[1])[0][0];
    const mostEnergeticDay = Object.entries(energyByDay).sort((a, b) => b[1] - a[1])[0][0];
    res.json({
      avgMood: +(totalMood / entries.length).toFixed(1),
      mostStressfulDay,
      mostEnergeticDay
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

// 7. Update Journal Entry
export async function updateEntry(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;

    // Analyze emotion with AI again for the modified text
    const aiResult = await analyzeEmotion(text);

    const updatedEntry = await JournalEntry.findByIdAndUpdate(
      id,
      {
        text,
        emotion: aiResult.emotion,
        emotionScores: new Map(Object.entries(aiResult.emotionScores)),
        moodScore: aiResult.moodScore,
        stressScore: aiResult.stressScore,
        energyScore: aiResult.energyScore,
        suggestions: aiResult.suggestions,
      },
      { returnDocument: 'after' } // returns the updated document
    );

    if (!updatedEntry) {
      return res.status(404).json({ status: "error", message: "Entry not found" });
    }

    res.json({
      entryId: updatedEntry._id,
      status: "success",
      message: "Journal entry updated securely.",
      emotion: aiResult.emotion,
      emotionScores: aiResult.emotionScores,
      moodScore: aiResult.moodScore,
      stressScore: aiResult.stressScore,
      energyScore: aiResult.energyScore,
      suggestions: aiResult.suggestions,
    });
  } catch (err) {
    console.error("[updateEntry] Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

// 8. Delete Journal Entry
export async function deleteEntry(req, res) {
  try {
    const { id } = req.params;

    const deletedEntry = await JournalEntry.findByIdAndDelete(id);
    if (!deletedEntry) {
      return res.status(404).json({ status: "error", message: "Entry not found" });
    }

    res.json({
      status: "success",
      message: "Journal entry deleted.",
      entryId: id,
    });
  } catch (err) {
    console.error("[deleteEntry] Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}
