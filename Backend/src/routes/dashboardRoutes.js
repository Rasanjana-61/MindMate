const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { Task } = require("../models/Task");
const { FocusSession } = require("../models/FocusSession");
const { MoodLog } = require("../models/MoodLog");
const { PeerPost } = require("../models/PeerPost");
const { PeerReply } = require("../models/PeerReply");
const { Resource } = require("../models/Resource");

const router = express.Router();

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function getMoodEmoji(value) {
  if (value >= 4.5) return "😊";
  if (value >= 3.5) return "😌";
  if (value >= 2.5) return "😐";
  if (value >= 1.5) return "😔";
  return "😢";
}

function calculateFocusStreak(sessions) {
  if (!sessions.length) {
    return 0;
  }

  const uniqueDays = [
    ...new Set(sessions.map((session) => startOfUtcDay(new Date(session.completedAt)).toISOString())),
  ].sort();

  let streak = 1;

  for (let index = uniqueDays.length - 1; index > 0; index -= 1) {
    const current = new Date(uniqueDays[index]);
    const previous = new Date(uniqueDays[index - 1]);
    const diffDays = Math.round((current - previous) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      break;
    }
  }

  return streak;
}

router.use(protect);

router.get("/overview", async (req, res) => {
  try {
    const todayStart = startOfUtcDay(new Date());
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);

    const [
      tasks,
      focusSessions,
      moodLogs,
      peerPosts,
      peerReplies,
      resources,
    ] = await Promise.all([
      Task.find({ user: req.user._id }).sort({ dueDate: 1, createdAt: -1 }).limit(5),
      FocusSession.find({
        user: req.user._id,
        sessionType: "focus",
        completed: true,
      }).sort({ completedAt: 1 }),
      MoodLog.find({ user: req.user._id }).sort({ entryDate: 1 }),
      PeerPost.find({
        faculty: req.user.faculty,
        moderationStatus: "visible",
      }).sort({ createdAt: -1 }).limit(4),
      PeerReply.find({ faculty: req.user.faculty, moderationStatus: "visible" }),
      Resource.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(3),
    ]);

    const todayFocusMinutes = focusSessions
      .filter((session) => new Date(session.completedAt) >= todayStart)
      .reduce((sum, session) => sum + session.completedDurationMinutes, 0);
    const weekFocusMinutes = focusSessions
      .filter((session) => new Date(session.completedAt) >= weekStart)
      .reduce((sum, session) => sum + session.completedDurationMinutes, 0);

    const completedTasks = tasks.filter((task) => task.completed).length;
    const totalTasks = tasks.length;

    const recentMoodLogs = moodLogs.filter((log) => new Date(log.entryDate) >= weekStart);
    const averageMood = recentMoodLogs.length
      ? Number(
          (
            recentMoodLogs.reduce((sum, log) => sum + log.moodValue, 0) / recentMoodLogs.length
          ).toFixed(1)
        )
      : 0;

    const repliesByPost = peerReplies.reduce((accumulator, reply) => {
      const key = String(reply.post);
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const peerDiscussions = peerPosts.map((post) => ({
      id: post._id,
      title: post.content,
      replies: repliesByPost[String(post._id)] || 0,
      tag: post.category,
    }));

    let wellnessTip =
      "Remember the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.";

    if (averageMood && averageMood < 3) {
      wellnessTip = "Your recent mood trend looks lower. Try scheduling one lighter task block and one short recovery break today.";
    } else if (todayFocusMinutes >= 120) {
      wellnessTip = "You have already logged solid focus time today. Protect your energy with a proper break before the next study block.";
    } else if (tasks.some((task) => !task.completed && task.priority === "high")) {
      wellnessTip = "You still have a high-priority task open. Try tackling it in one uninterrupted focus session.";
    }

    return res.json({
      stats: {
        todayFocusMinutes,
        todayFocusLabel: formatMinutes(todayFocusMinutes),
        completedTasks,
        totalTasks,
        streakDays: calculateFocusStreak(focusSessions),
        averageMood,
        averageMoodEmoji: getMoodEmoji(averageMood),
      },
      tasks: tasks.map((task) => ({
        id: task._id,
        title: task.title,
        priority: task.priority,
        completed: task.completed,
        dueDate: task.dueDate,
      })),
      focus: {
        todayFocusMinutes,
        todayFocusLabel: formatMinutes(todayFocusMinutes),
        dailyGoalHours: req.user.preferences?.dailyGoal || 4,
        goalProgressPercent: Math.min(
          100,
          Math.round((todayFocusMinutes / ((req.user.preferences?.dailyGoal || 4) * 60)) * 100)
        ),
      },
      mood: {
        averageMood,
        averageMoodEmoji: getMoodEmoji(averageMood),
      },
      resources: resources.map((resource) => ({
        id: resource._id,
        title: resource.originalFileName,
        subject: resource.subject,
        createdAt: resource.createdAt,
      })),
      peerDiscussions,
      wellnessTip,
    });
  } catch (error) {
    console.error("Fetch dashboard overview error:", error);
    return res.status(500).json({ message: "Server error while loading dashboard." });
  }
});

module.exports = router;
