import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  getFocusSettings,
  getFocusStats,
  recordSession,
  updateFocusSettings,
} from '../services/focusService.js';

const router = Router();

router.get('/settings', asyncHandler(async (_request, response) => {
  response.json(await getFocusSettings());
}));

router.put('/settings', asyncHandler(async (request, response) => {
  response.json(await updateFocusSettings(request.body));
}));

router.get('/stats', asyncHandler(async (_request, response) => {
  response.json(await getFocusStats());
}));

router.post('/sessions', asyncHandler(async (request, response) => {
  await recordSession(request.body);
  response.status(201).send();
}));

export default router;
