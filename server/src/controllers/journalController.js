import {
  createEntry,
  findEntries,
  findEntryById,
  findEntryByDate,
  updateEntry,
  deleteEntry,
  countEntries,
  countEntriesThisMonth,
  countEntriesThisWeek,
} from '../repositories/journalRepository.js';

const VALID_MOODS = ['GREAT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE'];
const PAGE_SIZE = 20;

const getEntries = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = parseInt(req.query.limit) || PAGE_SIZE;
    const offset = (page - 1) * limit;
    const { mood } = req.query;

    if (mood && !VALID_MOODS.includes(mood)) {
      return res.status(400).json({ success: false, message: `Invalid mood filter` });
    }

    const { rows: entries, count } = await findEntries(userId, { offset, limit, mood });
    return res.json({
      success: true,
      data: entries,
      count,
      page,
      pages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('getEntries error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getEntry = async (req, res) => {
  try {
    const entry = await findEntryById(req.params.id, req.user.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    return res.json({ success: true, data: entry });
  } catch (err) {
    console.error('getEntry error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createJournalEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, mood, tags, date } = req.body;

    if (!title?.trim()) return res.status(400).json({ success: false, message: 'title is required' });
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'content is required' });
    if (mood && !VALID_MOODS.includes(mood)) {
      return res.status(400).json({ success: false, message: `Invalid mood. Must be one of: ${VALID_MOODS.join(', ')}` });
    }

    const entryDate = date ?? new Date().toISOString().split('T')[0];

    const entry = await createEntry({
      userId,
      title: title.trim(),
      content: content.trim(),
      mood: mood ?? null,
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      date: entryDate,
    });

    return res.status(201).json({ success: true, data: entry, message: 'Journal entry created' });
  } catch (err) {
    console.error('createJournalEntry error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateJournalEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, mood, tags, date } = req.body;

    const existing = await findEntryById(req.params.id, userId);
    if (!existing) return res.status(404).json({ success: false, message: 'Entry not found' });

    if (mood && !VALID_MOODS.includes(mood)) {
      return res.status(400).json({ success: false, message: `Invalid mood. Must be one of: ${VALID_MOODS.join(', ')}` });
    }

    const updated = await updateEntry(req.params.id, userId, {
      title: title?.trim() ?? existing.title,
      content: content?.trim() ?? existing.content,
      mood: mood !== undefined ? (mood ?? null) : existing.mood,
      tags: Array.isArray(tags) ? tags.filter(Boolean) : existing.tags,
      date: date ?? existing.date,
    });

    return res.json({ success: true, data: updated, message: 'Entry updated' });
  } catch (err) {
    console.error('updateJournalEntry error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteJournalEntry = async (req, res) => {
  try {
    const deleted = await deleteEntry(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Entry not found' });
    return res.json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    console.error('deleteJournalEntry error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getJournalStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [total, monthCount, weekCount] = await Promise.all([
      countEntries(userId),
      countEntriesThisMonth(userId),
      countEntriesThisWeek(userId),
    ]);

    return res.json({ success: true, data: { total, monthCount, weekCount } });
  } catch (err) {
    console.error('getJournalStats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTodayEntry = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const entry = await findEntryByDate(req.user.id, today);
    return res.json({ success: true, data: entry ?? null });
  } catch (err) {
    console.error('getTodayEntry error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { getEntries, getEntry, createJournalEntry, updateJournalEntry, deleteJournalEntry, getJournalStats, getTodayEntry };
