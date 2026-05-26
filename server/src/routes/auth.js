import { Router } from 'express';
import authController from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require valid JWT)
router.get('/me', protect, authController.getMe);
router.put('/onboarding', protect, authController.updateOnboarding);

export default router;
