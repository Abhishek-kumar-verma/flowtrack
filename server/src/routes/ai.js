import { Router } from 'express';
import protect from '../middleware/auth.js';
import aiController from '../controllers/aiController.js';

const router = Router();

// All AI routes require authentication
router.use(protect);

/**
 * POST /api/ai/daily-summary
 * Generate (or regenerate) today's AI daily report for the authenticated user.
 */
router.post('/daily-summary', aiController.generateDailySummaryHandler);

/**
 * GET /api/ai/report?date=YYYY-MM-DD
 * Retrieve saved daily report. Defaults to today if date is omitted.
 */
router.get('/report', aiController.getDailyReport);

/**
 * GET /api/ai/weekly
 * Fetch / generate weekly report for the current Mon–Sun week.
 */
router.get('/weekly', aiController.getWeeklyReport);

/**
 * POST /api/ai/chat
 * Body: { message: string, conversationHistory?: [{ role, content }] }
 */
router.post('/chat', aiController.chatWithAI);

/**
 * GET /api/ai/quote
 * AI-generated motivational quote tailored to the user's life goal.
 */
router.get('/quote', aiController.generateQuoteForUser);

export default router;
