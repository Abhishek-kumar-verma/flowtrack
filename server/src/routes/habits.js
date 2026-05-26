import { Router } from 'express';
import protect from '../middleware/auth.js';
import habitController from '../controllers/habitController.js';

const router = Router();

// All habit routes require authentication
router.use(protect);

// Static routes before dynamic :id routes
router.get('/',          habitController.getHabits);
router.get('/calendar',  habitController.getHabitsWithLogs);

router.post('/',         habitController.createHabit);
router.put('/:id',       habitController.updateHabit);
router.delete('/:id',    habitController.deleteHabit);

router.post('/:id/log',    habitController.logHabit);
router.get('/:id/streak',  habitController.getHabitStreak);

export default router;
