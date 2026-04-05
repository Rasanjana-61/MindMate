import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  createTask,
  deleteTask,
  getTasks,
  toggleTaskCompletion,
  updateTask,
} from '../services/taskService.js';

const router = Router();

router.get('/', asyncHandler(async (_request, response) => {
  response.json(await getTasks());
}));

router.post('/', asyncHandler(async (request, response) => {
  const task = await createTask(request.body);
  response.status(201).json(task);
}));

router.put('/:taskId', asyncHandler(async (request, response) => {
  response.json(await updateTask(request.params.taskId, request.body));
}));

router.patch('/:taskId/toggle-completion', asyncHandler(async (request, response) => {
  response.json(await toggleTaskCompletion(request.params.taskId));
}));

router.delete('/:taskId', asyncHandler(async (request, response) => {
  await deleteTask(request.params.taskId);
  response.status(204).send();
}));

export default router;
