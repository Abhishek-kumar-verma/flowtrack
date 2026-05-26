import { Router } from 'express';
import protect from '../middleware/auth.js';
import analyticsController from '../controllers/analyticsController.js';

const router = Router();

// All analytics routes require authentication
router.use(protect);

/**
 * GET /api/analytics/
 * Overall lifetime stats: totals, streaks, focus hours, productivity scores.
 */
router.get('/', analyticsController.getOverallStats);

/**
 * GET /api/analytics/tasks
 * Task-level analytics: by category, by priority, 30-day trend, avg time, overdue.
 */
router.get('/tasks', analyticsController.getTaskAnalytics);

/**
 * GET /api/analytics/productivity?period=week|month|year
 * Daily productivity scores for the specified period. Defaults to "week".
 */
router.get('/productivity', analyticsController.getProductivityTrend);

/**
 * GET /api/analytics/heatmap?year=YYYY
 * GitHub-style contribution heatmap for the full year. Defaults to current year.
 */
router.get('/heatmap', analyticsController.getHeatmapData);

/**
 * GET /api/analytics/streaks
 * Current and longest streaks for tasks, gym, learning, and habits.
 */
router.get('/streaks', analyticsController.getStreakData);

export default router;
