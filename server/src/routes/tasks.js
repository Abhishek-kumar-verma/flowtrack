import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import taskController from '../controllers/taskController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Static routes must come before dynamic :id routes
router.get('/',       taskController.getTasks);
router.get('/today',  taskController.getTodaysTasks);
router.get('/:id',    taskController.getTask);

router.post('/',      taskController.createTask);
router.put('/:id',    taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

router.patch('/:id/status', taskController.updateTaskStatus);
router.patch('/:id/time',   taskController.logTime);

export default router;
