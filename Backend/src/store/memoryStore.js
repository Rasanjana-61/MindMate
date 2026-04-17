import { defaultTasks } from '../seed/defaultData.js';

let tasks = [];
let focusSettings = null;
let focusSessions = [];

function clone(value) {
  return structuredClone(value);
}

function toTaskRecord(task) {
  const now = new Date();

  return {
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : now,
    createdAt: task.createdAt ? new Date(task.createdAt) : now,
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : now,
  };
}

export function seedMemoryStore() {
  if (tasks.length === 0) {
    tasks = defaultTasks.map(toTaskRecord);
  }

  if (!focusSettings) {
    focusSettings = {
      key: 'default',
      focusDuration: 25,
      breakDuration: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export function listMemoryTasks() {
  return clone(tasks).sort((left, right) => {
    const createdAtDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();

    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return right.id.localeCompare(left.id);
  });
}

export function addMemoryTask(task) {
  const record = toTaskRecord(task);
  tasks.push(record);
  return clone(record);
}

export function getMemoryTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  return task ? clone(task) : null;
}

export function updateMemoryTask(taskId, updates) {
  const index = tasks.findIndex((item) => item.id === taskId);

  if (index === -1) {
    return null;
  }

  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date(),
  };

  return clone(tasks[index]);
}

export function deleteMemoryTask(taskId) {
  const initialLength = tasks.length;
  tasks = tasks.filter((task) => task.id !== taskId);
  return tasks.length !== initialLength;
}

export function getMemoryFocusSettings() {
  seedMemoryStore();
  return clone(focusSettings);
}

export function updateMemoryFocusSettings(updates) {
  seedMemoryStore();
  focusSettings = {
    ...focusSettings,
    ...updates,
    updatedAt: new Date(),
  };

  return clone(focusSettings);
}

export function listMemoryFocusSessions() {
  return clone(focusSessions);
}

export function addMemoryFocusSession(session) {
  const now = new Date();
  focusSessions.push({
    ...session,
    completedAt: session.completedAt ? new Date(session.completedAt) : now,
    createdAt: now,
    updatedAt: now,
  });
}
