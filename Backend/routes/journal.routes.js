import { Router } from "express";
import {
  submitEntry,
  analyzeTextAPI,
  getDashboardStats,
  getMoodHistory,
  getEntryDetailsByDate,
  getWeeklySummary,
  updateEntry,
  deleteEntry
} from "../controllers/journal.controller.js";

const router = Router();

router.post("/entries", submitEntry);
router.put("/entries/:id", updateEntry);
router.delete("/entries/:id", deleteEntry);
router.post("/analyze", analyzeTextAPI);
router.get("/dashboard/:userId", getDashboardStats);
router.get("/history/:userId", getMoodHistory);
router.get("/history/:userId/:entryDate", getEntryDetailsByDate);
router.get("/weekly-summary/:userId", getWeeklySummary);

export default router;
