import { Router } from 'express';
import protect from '../middleware/auth.js';
import journalController from '../controllers/journalController.js';

const router = Router();

router.use(protect);

router.get('/stats', journalController.getJournalStats);
router.get('/today', journalController.getTodayEntry);
router.get('/', journalController.getEntries);
router.get('/:id', journalController.getEntry);
router.post('/', journalController.createJournalEntry);
router.put('/:id', journalController.updateJournalEntry);
router.delete('/:id', journalController.deleteJournalEntry);

export default router;
