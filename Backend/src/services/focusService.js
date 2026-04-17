import FocusSettings from '../models/FocusSettings.js';
import FocusSession from '../models/FocusSession.js';
import AppError from '../errors/AppError.js';
import { isDatabaseConnected } from '../config/database.js';
import {
  addMemoryFocusSession,
  getMemoryFocusSettings,
  listMemoryFocusSessions,
  updateMemoryFocusSettings,
} from '../store/memoryStore.js';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(date, value) {
  const result = new Date(date);
  result.setDate(result.getDate() + value);
  return result;
}

function validateFocusSettingsPayload(payload) {
  const fieldErrors = {};

  if (!Number.isInteger(payload.focusDuration) || payload.focusDuration < 10 || payload.focusDuration > 90) {
    fieldErrors.focusDuration = 'focusDuration must be between 10 and 90';
  }

  if (!Number.isInteger(payload.breakDuration) || payload.breakDuration < 5 || payload.breakDuration > 30) {
    fieldErrors.breakDuration = 'breakDuration must be between 5 and 30';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError(400, 'Validation failed', fieldErrors);
  }
}

function normalizeSessionMode(mode) {
  if (typeof mode !== 'string') {
    return null;
  }

  const normalized = mode.trim().toUpperCase();

  if (normalized === 'FOCUS') {
    return 'Focus';
  }

  if (normalized === 'BREAK') {
    return 'Break';
  }

  return null;
}

function validateSessionPayload(payload) {
  const fieldErrors = {};

  if (!normalizeSessionMode(payload.mode)) {
    fieldErrors.mode = 'Invalid session mode';
  }

  if (!Number.isInteger(payload.completedMinutes) || payload.completedMinutes < 1) {
    fieldErrors.completedMinutes = 'completedMinutes must be at least 1';
  }

  if (payload.completedAt != null && Number.isNaN(new Date(payload.completedAt).getTime())) {
    fieldErrors.completedAt = 'completedAt must be a valid ISO date';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError(400, 'Validation failed', fieldErrors);
  }
}

async function getOrCreateSettings() {
  if (!isDatabaseConnected()) {
    return getMemoryFocusSettings();
  }

  let settings = await FocusSettings.findOne({ key: 'default' });

  if (!settings) {
    settings = await FocusSettings.create({
      key: 'default',
      focusDuration: 25,
      breakDuration: 5,
    });
  }

  return settings;
}

function calculateStreak(sessions) {
  if (sessions.length === 0) {
    return 0;
  }

  const uniqueDates = [];
  const seen = new Set();

  for (const session of sessions) {
    const dateKey = new Date(session.completedAt).toISOString().slice(0, 10);
    if (!seen.has(dateKey)) {
      seen.add(dateKey);
      uniqueDates.push(dateKey);
    }
  }

  let cursor = uniqueDates[0];
  let streak = 0;

  for (const dateKey of uniqueDates) {
    if (dateKey === cursor) {
      streak += 1;
      cursor = addDays(new Date(`${cursor}T00:00:00.000Z`), -1).toISOString().slice(0, 10);
      continue;
    }

    break;
  }

  return streak;
}

export async function getFocusSettings() {
  const settings = await getOrCreateSettings();

  return {
    focusDuration: settings.focusDuration,
    breakDuration: settings.breakDuration,
  };
}

export async function updateFocusSettings(payload) {
  validateFocusSettingsPayload(payload);

  if (!isDatabaseConnected()) {
    const settings = updateMemoryFocusSettings({
      focusDuration: payload.focusDuration,
      breakDuration: payload.breakDuration,
    });

    return {
      focusDuration: settings.focusDuration,
      breakDuration: settings.breakDuration,
    };
  }

  const settings = await getOrCreateSettings();
  settings.focusDuration = payload.focusDuration;
  settings.breakDuration = payload.breakDuration;
  await settings.save();

  return {
    focusDuration: settings.focusDuration,
    breakDuration: settings.breakDuration,
  };
}

export async function getFocusStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfDay(addDays(now, -6));

  if (!isDatabaseConnected()) {
    const sessions = listMemoryFocusSessions()
      .filter((session) => session.mode === 'Focus')
      .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime());

    const todayFocusSessions = sessions.filter((session) => {
      const completedAt = new Date(session.completedAt);
      return completedAt >= todayStart && completedAt <= todayEnd;
    });
    const weekFocusSessions = sessions.filter((session) => {
      const completedAt = new Date(session.completedAt);
      return completedAt >= weekStart && completedAt <= todayEnd;
    });

    const todayMinutes = todayFocusSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const weekMinutes = weekFocusSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const weeklyTotals = new Map(dayLabels.map((label) => [label, 0]));

    for (const session of weekFocusSessions) {
      const label = dayLabels[new Date(session.completedAt).getDay()];
      weeklyTotals.set(label, weeklyTotals.get(label) + session.durationMinutes);
    }

    return {
      todayMinutes,
      weekMinutes,
      streak: calculateStreak(sessions),
      completedSessions: sessions.length,
      weeklyTrend: dayLabels.map((day) => ({
        day,
        minutes: weeklyTotals.get(day) ?? 0,
      })),
    };
  }

  const [todayFocusSessions, weekFocusSessions, allFocusSessions] = await Promise.all([
    FocusSession.find({
      mode: 'Focus',
      completedAt: { $gte: todayStart, $lte: todayEnd },
    }),
    FocusSession.find({
      mode: 'Focus',
      completedAt: { $gte: weekStart, $lte: todayEnd },
    }),
    FocusSession.find({ mode: 'Focus' }).sort({ completedAt: -1, _id: -1 }),
  ]);

  const todayMinutes = todayFocusSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const weekMinutes = weekFocusSessions.reduce((sum, session) => sum + session.durationMinutes, 0);

  const weeklyTotals = new Map(dayLabels.map((label) => [label, 0]));

  for (const session of weekFocusSessions) {
    const label = dayLabels[new Date(session.completedAt).getDay()];
    weeklyTotals.set(label, weeklyTotals.get(label) + session.durationMinutes);
  }

  return {
    todayMinutes,
    weekMinutes,
    streak: calculateStreak(allFocusSessions),
    completedSessions: allFocusSessions.length,
    weeklyTrend: dayLabels.map((day) => ({
      day,
      minutes: weeklyTotals.get(day) ?? 0,
    })),
  };
}

export async function recordSession(payload) {
  validateSessionPayload(payload);

  if (!isDatabaseConnected()) {
    addMemoryFocusSession({
      mode: normalizeSessionMode(payload.mode),
      durationMinutes: payload.completedMinutes,
      completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date(),
    });

    return;
  }

  await FocusSession.create({
    mode: normalizeSessionMode(payload.mode),
    durationMinutes: payload.completedMinutes,
    completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date(),
  });
}
