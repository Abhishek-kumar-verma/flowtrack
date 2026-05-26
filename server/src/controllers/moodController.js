import { findMoodLogByDate, createMoodLog, findMoodLogsByRange } from '../repositories/moodRepository.js';
import db from '../models/index.js';
import { Op } from 'sequelize';

const VALID_MOODS = ['GREAT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE'];

const logMood = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood, note } = req.body;

    if (!mood) {
      return res.status(400).json({ success: false, message: 'mood is required' });
    }

    if (!VALID_MOODS.includes(mood)) {
      return res.status(400).json({
        success : false,
        message : `Invalid mood. Must be one of: ${VALID_MOODS.join(', ')}`,
      });
    }

    const today = new Date().toISOString().split('T')[0];

    const existing = await findMoodLogByDate(userId, today);

    if (existing) {
      const updated = await db.MoodLog.update(
        { mood, note: note ?? null },
        { where: { id: existing.id }, returning: true }
      ).then(([, rows]) => rows[0]);
      return res.json({
        success : true,
        data    : updated,
        message : "Today's mood updated",
      });
    }

    const log = await createMoodLog({
      userId,
      mood,
      note : note ?? null,
      date : new Date().toISOString().split('T')[0],
    });

    return res.status(201).json({ success: true, data: log, message: "Today's mood logged" });
  } catch (err) {
    console.error('logMood error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMoodLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 29);
    defaultStart.setHours(0, 0, 0, 0);

    const logs = await findMoodLogsByRange(
      userId,
      startDate ? new Date(startDate) : defaultStart,
      endDate ? new Date(endDate) : new Date()
    );

    return res.json({ success: true, data: logs, count: logs.length });
  } catch (err) {
    console.error('getMoodLogs error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTodaysMood = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const log = await findMoodLogByDate(userId, today);

    return res.json({ success: true, data: log ?? null });
  } catch (err) {
    console.error('getTodaysMood error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { logMood, getMoodLogs, getTodaysMood };
