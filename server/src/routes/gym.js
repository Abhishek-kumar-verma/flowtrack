import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import gymController from '../controllers/gymController.js';

const router = Router();

router.use(authenticate);

// Static routes before dynamic :id
router.get('/',       gymController.getGymLogs);
router.get('/stats',  gymController.getGymStats);
router.get('/today',  gymController.getTodaysWorkout);
router.get('/:id',    gymController.getGymLog);

router.post('/',      gymController.createGymLog);
router.put('/:id',    gymController.updateGymLog);
router.delete('/:id', gymController.deleteGymLog);

export default router;
