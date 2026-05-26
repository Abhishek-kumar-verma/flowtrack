import { Router } from 'express';
import protect from '../middleware/auth.js';
import moodController from '../controllers/moodController.js';

const router = Router();

router.use(protect);

// Static /today must come before any future dynamic routes
router.get('/',      moodController.getMoodLogs);
router.get('/today', moodController.getTodaysMood);
router.post('/',     moodController.logMood);

export default router;
