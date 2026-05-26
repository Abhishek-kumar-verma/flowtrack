import { Router } from 'express';
import protect from '../middleware/auth.js';
import quotesController from '../controllers/quotesController.js';

const router = Router();

// ── Public routes (no auth required) ─────────────────────────────────────────

/**
 * GET /api/quotes/today
 * Returns today's quote of the day. Auto-seeds from static bank if none assigned.
 */
router.get('/today', quotesController.getQuoteOfTheDay);

/**
 * GET /api/quotes/random
 * Returns a random quote from the DB (or static bank when DB is empty).
 */
router.get('/random', quotesController.getRandomQuote);

// ── Protected routes ──────────────────────────────────────────────────────────

/**
 * GET /api/quotes
 * Paginated list of all quotes. Requires authentication.
 */
router.get('/', protect, quotesController.getAllQuotes);

/**
 * POST /api/quotes
 * Add a custom quote. Requires authentication.
 * Body: { content: string, author?: string, category?: string }
 */
router.post('/', protect, quotesController.addQuote);

export default router;
