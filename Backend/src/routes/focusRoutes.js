const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { Task } = require("../models/Task");
const { FocusSession } = require("../models/FocusSession");
const { createNotification } = require("../utils/notifications");

const router = express.Router();

function normalizeDate(input) {
  if (!input) {
    return null;
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function validateTaskPayload(payload) {
  const errors = {};

  if (!payload.title?.trim()) {
    errors.title = "Task title is required.";
  } else if (payload.title.trim().length > 120) {
    errors.title = "Task title must be 120 characters or less.";
  }

  if (payload.description && payload.description.trim().length > 400) {
    errors.description = "Description must be 400 characters or less.";
  }

  if (payload.priority && !["low", "medium", "high"].includes(payload.priority)) {
    errors.priority = "Select a valid priority.";
  }

  const dueDate = payload.dueDate ? normalizeDate(payload.dueDate) : null;
  if (payload.dueDate && !dueDate) {
    errors.dueDate = "Enter a valid due date.";
  }

  return {
    errors,
    values: {
      title: payload.title?.trim() || "",
      description: payload.description?.trim() || "",
      dueDate,
      priority: payload.priority || "medium",
      completed: Boolean(payload.completed),
      subject: payload.subject?.trim() || "",
      pomodoros: Number(payload.pomodoros) || 1,
      totalTimeSpent: Number(payload.totalTimeSpent) || 0,
    },
  };
}

function validateSessionPayload(payload) {
  const errors = {};
  const sessionType = payload.sessionType === "break" ? "break" : "focus";
  const plannedDurationMinutes = Number(payload.plannedDurationMinutes);
  const completedDurationMinutes = Number(payload.completedDurationMinutes);
  const completedAt = payload.completedAt ? normalizeDate(payload.completedAt) : new Date();

  if (!Number.isFinite(plannedDurationMinutes) || plannedDurationMinutes < 1 || plannedDurationMinutes > 240) {
    errors.plannedDurationMinutes = "Planned duration must be between 1 and 240 minutes.";
  }

  if (
    !Number.isFinite(completedDurationMinutes) ||
    completedDurationMinutes < 0.1 ||
    completedDurationMinutes > 240
  ) {
    errors.completedDurationMinutes = "Completed duration must be at least 6 seconds.";
  }

  if (!completedAt) {
    errors.completedAt = "Enter a valid completion date.";
  }

  return {
    errors,
    values: {
      sessionType,
      plannedDurationMinutes,
      completedDurationMinutes,
      completedAt,
      taskId: payload.taskId || null,
    },
  };
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

    if (aDue !== bDue) {
      return aDue - bDue;
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function formatTask(task) {
  return {
    id: task._id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    completed: task.completed,
    completedAt: task.completedAt,
    subject: task.subject,
    pomodoros: task.pomodoros,
    totalTimeSpent: task.totalTimeSpent || 0,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function buildChartData(sessions) {
  const start = startOfUtcDay(new Date());
  start.setUTCDate(start.getUTCDate() - 6);

  const totals = new Map();
  for (let index = 0; index < 7; index += 1) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + index);
    totals.set(current.toISOString(), 0);
  }

  sessions.forEach((session) => {
    const day = startOfUtcDay(new Date(session.completedAt)).toISOString();
    if (totals.has(day)) {
      totals.set(day, totals.get(day) + session.completedDurationMinutes);
    }
  });

  return Array.from(totals.entries()).map(([isoDate, totalMinutes]) => {
    const date = new Date(isoDate);
    return {
      date: isoDate,
      name: date.toLocaleDateString("en-US", { weekday: "short" }),
      minutes: totalMinutes,
      hours: Number((totalMinutes / 60).toFixed(1)),
    };
  });
}

function calculateStreak(sessions) {
  if (!sessions.length) {
    return 0;
  }

  const uniqueDays = [
    ...new Set(
      sessions.map((session) => startOfUtcDay(new Date(session.completedAt)).toISOString())
    ),
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

function buildOverview(tasks, sessions) {
  const focusSessions = sessions.filter((session) => session.sessionType === "focus");
  const todayStart = startOfUtcDay(new Date());
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  const todayFocusMinutes = focusSessions
    .filter((session) => new Date(session.completedAt) >= todayStart)
    .reduce((sum, session) => sum + session.completedDurationMinutes, 0);

  const weekSessions = focusSessions.filter((session) => new Date(session.completedAt) >= weekStart);
  const weekFocusMinutes = weekSessions.reduce(
    (sum, session) => sum + session.completedDurationMinutes,
    0
  );

  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  return {
    tasks: sortTasks(tasks).map(formatTask),
    stats: {
      todayFocusMinutes,
      weekFocusMinutes,
      completedTasks,
      pendingTasks,
      totalTasks: tasks.length,
      streakDays: calculateStreak(focusSessions),
    },
    chartData: buildChartData(weekSessions),
    recentSessions: focusSessions
      .slice(-5)
      .reverse()
      .map((session) => ({
        id: session._id,
        completedAt: session.completedAt,
        completedDurationMinutes: session.completedDurationMinutes,
      })),
  };
}

router.use(protect);

router.get("/overview", async (req, res) => {
  try {
    const [tasks, sessions] = await Promise.all([
      Task.find({ user: req.user._id }).sort({ createdAt: -1 }),
      FocusSession.find({ user: req.user._id, completed: true }).sort({ completedAt: 1 }),
    ]);

    return res.json(buildOverview(tasks, sessions));
  } catch (error) {
    console.error("Fetch focus overview error:", error);
    return res.status(500).json({ message: "Server error while loading focus data." });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const { errors, values } = validateTaskPayload(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted task fields.",
        errors,
      });
    }

    const task = await Task.create({
      user: req.user._id,
      ...values,
      completedAt: values.completed ? new Date() : null,
    });

    await createNotification({
      user: req.user._id,
      type: values.completed ? "task_completed" : "task_created",
      module: "focus",
      title: values.completed ? "Task completed" : "Task created",
      message: values.completed
        ? `You completed "${task.title}".`
        : `Task "${task.title}" was added to your planner.`,
      linkPage: "focus",
      task: task._id,
    });

    return res.status(201).json({
      message: "Task created successfully.",
      task: formatTask(task),
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ message: "Server error while creating task." });
  }
});

router.put("/tasks/:id", async (req, res) => {
  try {
    const { errors, values } = validateTaskPayload(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted task fields.",
        errors,
      });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const wasCompleted = task.completed;
    Object.assign(task, values);

    if (!wasCompleted && values.completed) {
      task.completedAt = new Date();
    }

    if (wasCompleted && !values.completed) {
      task.completedAt = null;
    }

    await task.save();

    await createNotification({
      user: req.user._id,
      type: values.completed ? "task_completed" : "task_updated",
      module: "focus",
      title: values.completed ? "Task completed" : "Task updated",
      message: values.completed
        ? `You completed "${task.title}".`
        : `Task "${task.title}" was updated.`,
      linkPage: "focus",
      task: task._id,
    });

    return res.json({
      message: "Task updated successfully.",
      task: formatTask(task),
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ message: "Server error while updating task." });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    await createNotification({
      user: req.user._id,
      type: "task_deleted",
      module: "focus",
      title: "Task deleted",
      message: `Task "${task.title}" was removed from your planner.`,
      linkPage: "focus",
    });

    return res.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ message: "Server error while deleting task." });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const { errors, values } = validateSessionPayload(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted session fields.",
        errors,
      });
    }

    const session = await FocusSession.create({
      user: req.user._id,
      ...values,
      completed: true,
    });

    if (values.taskId) {
      const task = await Task.findOne({ _id: values.taskId, user: req.user._id });
      if (task) {
        task.totalTimeSpent = (task.totalTimeSpent || 0) + values.completedDurationMinutes;
        await task.save();
      }
    }

    if (values.sessionType === "focus") {
      await createNotification({
        user: req.user._id,
        type: "focus_completed",
        module: "focus",
        title: "Focus session completed",
        message: `You completed a ${values.completedDurationMinutes}-minute focus session.`,
        linkPage: "focus",
      });
    }

    return res.status(201).json({
      message:
        values.sessionType === "focus"
          ? "Focus session saved successfully."
          : "Break session saved successfully.",
      session: {
        id: session._id,
        sessionType: session.sessionType,
        completedDurationMinutes: session.completedDurationMinutes,
        plannedDurationMinutes: session.plannedDurationMinutes,
        completedAt: session.completedAt,
      },
    });
  } catch (error) {
    console.error("Create focus session error:", error);
    return res.status(500).json({ message: "Server error while saving focus session." });
  }
});

module.exports = router;
