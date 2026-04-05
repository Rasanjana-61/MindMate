import { randomUUID } from 'node:crypto';
import Task from '../models/Task.js';
import AppError from '../errors/AppError.js';
import { PRIORITY_INPUTS, STATUS_INPUTS } from '../constants/taskConstants.js';

function validateString(value, field, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    return `${field} must be between ${min} and ${max} characters`;
  }

  return null;
}

function validateTaskPayload(payload) {
  const fieldErrors = {};

  const titleError = validateString(payload.title, 'title', 3, 120);
  if (titleError) {
    fieldErrors.title = titleError;
  }

  const descriptionError = validateString(payload.description, 'description', 10, 600);
  if (descriptionError) {
    fieldErrors.description = descriptionError;
  }

  const courseError = validateString(payload.course, 'course', 2, 60);
  if (courseError) {
    fieldErrors.course = courseError;
  }

  if (!Number.isInteger(payload.estimatedPomodoros) || payload.estimatedPomodoros < 1 || payload.estimatedPomodoros > 8) {
    fieldErrors.estimatedPomodoros = 'estimatedPomodoros must be between 1 and 8';
  }

  const nextActionError = validateString(payload.nextAction, 'nextAction', 5, 255);
  if (nextActionError) {
    fieldErrors.nextAction = nextActionError;
  }

  if (!normalizePriority(payload.priority)) {
    fieldErrors.priority = 'Invalid priority';
  }

  if (!normalizeStatus(payload.status)) {
    fieldErrors.status = 'Invalid status';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError(400, 'Validation failed', fieldErrors);
  }
}

function normalizePriority(priority) {
  if (typeof priority !== 'string') {
    return null;
  }

  const normalized = priority.trim().toUpperCase();
  return PRIORITY_INPUTS[normalized] ?? null;
}

function normalizeStatus(status) {
  if (typeof status !== 'string') {
    return null;
  }

  const normalized = status.trim().toUpperCase().replaceAll(' ', '_');
  return STATUS_INPUTS[normalized] ?? null;
}

function toResponse(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    course: task.course,
    estimatedPomodoros: task.estimatedPomodoros,
    nextAction: task.nextAction,
    priority: task.priority,
    status: task.status,
  };
}

function applyTaskPayload(task, payload) {
  task.title = payload.title.trim();
  task.description = payload.description.trim();
  task.course = payload.course.trim();
  task.estimatedPomodoros = payload.estimatedPomodoros;
  task.nextAction = payload.nextAction.trim();
  task.priority = normalizePriority(payload.priority);
  task.status = normalizeStatus(payload.status);
}

async function getTaskOrThrow(taskId) {
  const task = await Task.findOne({ id: taskId });

  if (!task) {
    throw new AppError(404, `Task not found: ${taskId}`);
  }

  return task;
}

export async function getTasks() {
  const tasks = await Task.find().sort({ createdAt: -1, _id: -1 });
  return tasks.map(toResponse);
}

export async function createTask(payload) {
  validateTaskPayload(payload);

  const task = new Task({
    id: payload.id?.trim() || randomUUID(),
    dueDate: new Date(),
  });

  applyTaskPayload(task, payload);
  await task.save();

  return toResponse(task);
}

export async function updateTask(taskId, payload) {
  validateTaskPayload(payload);

  const task = await getTaskOrThrow(taskId);
  applyTaskPayload(task, payload);
  await task.save();

  return toResponse(task);
}

export async function toggleTaskCompletion(taskId) {
  const task = await getTaskOrThrow(taskId);
  task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
  await task.save();

  return toResponse(task);
}

export async function deleteTask(taskId) {
  const task = await Task.findOneAndDelete({ id: taskId });

  if (!task) {
    throw new AppError(404, `Task not found: ${taskId}`);
  }
}
