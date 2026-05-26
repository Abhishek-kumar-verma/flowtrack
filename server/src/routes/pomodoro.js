import { Router } from 'express';
import protect from '../middleware/auth.js';
import pomodoroController from '../controllers/pomodoroController.js';

const router = Router();

router.use(protect);

// Static routes before dynamic :id routes
router.get('/',        pomodoroController.getSessions);
router.get('/stats',   pomodoroController.getStats);

router.post('/',           pomodoroController.startSession);
router.patch('/:id/end',   pomodoroController.endSession);

export default router;
