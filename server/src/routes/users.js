import { Router } from 'express';
import userController from '../controllers/userController.js';
import protect from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/dashboard', userController.getDashboardStats);

export default router;
