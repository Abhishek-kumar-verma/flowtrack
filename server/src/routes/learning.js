import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import learningController from '../controllers/learningController.js';

const router = Router();

router.use(authenticate);

// Static routes before dynamic :id
router.get('/',       learningController.getLearningLogs);
router.get('/stats',  learningController.getLearningStats);
router.get('/:id',    learningController.getLearningLog);

router.post('/',      learningController.createLearningLog);
router.put('/:id',    learningController.updateLearningLog);
router.delete('/:id', learningController.deleteLearningLog);

export default router;
