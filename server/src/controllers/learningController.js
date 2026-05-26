import { Op, fn, col } from 'sequelize';
import {
  findLearningLogs,
  findLearningLogById,
  createLearningLog as createLearningLogInDB,
  updateLearningLog as updateLearningLogInDB,
  deleteLearningLog as deleteLearningLogInDB,
  findLearningLogsByDateRange,
} from '../repositories/learningRepository.js';
import db from '../models/index.js';

const VALID_CATEGORIES = [
  'SYSTEM_DESIGN',
  'BACKEND',
  'DEVOPS',
  'AI_ML',
  'CLOUD',
  'DSA',
  'ARCHITECTURE',
  'LEADERSHIP',
  'ENGINEERING_MANAGEMENT',
];

const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

const isValidDate = (str) => {
  const d = new Date(str);
  return !isNaN(d.getTime());
};

const getLearningLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, startDate, endDate, page = 1, limit = 20 } = req.query;

    if (startDate && !isValidDate(startDate)) {
      return res.status(400).json({ success: false, message: 'Invalid startDate' });
    }
    if (endDate && !isValidDate(endDate)) {
      return res.status(400).json({ success: false, message: 'Invalid endDate' });
    }

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const where = { userId };

    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    }

    if (startDate && endDate) {
      where.date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      where.date = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.date = { [Op.lte]: new Date(endDate) };
    }

    const { count: total, rows: logs } = await findLearningLogs({
      where,
      order : [['date', 'DESC']],
      offset: skip,
      limit : limitNum,
    });

    return res.json({
      success    : true,
      data       : logs,
      pagination : { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('getLearningLogs error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getLearningLog = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const log = await findLearningLogById(id, userId);
    if (!log) return res.status(404).json({ success: false, message: 'Learning log not found' });

    return res.json({ success: true, data: log });
  } catch (err) {
    console.error('getLearningLog error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createLearningLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, category, notes, resources, timeSpent, difficulty, date } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success : false,
        message : `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        success : false,
        message : `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
      });
    }

    if (timeSpent === undefined || isNaN(Number(timeSpent)) || Number(timeSpent) < 0) {
      return res.status(400).json({ success: false, message: 'A valid timeSpent (minutes) is required' });
    }

    if (date && !isValidDate(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const log = await createLearningLogInDB({
      userId,
      topic      : topic.trim(),
      category,
      notes      : notes ?? null,
      resources  : Array.isArray(resources) ? resources : [],
      timeSpent  : Number(timeSpent),
      difficulty : difficulty ?? 'MEDIUM',
      date       : date ? new Date(date) : new Date(),
    });

    return res.status(201).json({ success: true, data: log });
  } catch (err) {
    console.error('createLearningLog error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateLearningLog = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const existing = await findLearningLogById(id, userId);
    if (!existing) return res.status(404).json({ success: false, message: 'Learning log not found' });

    const { topic, category, notes, resources, timeSpent, difficulty, date } = req.body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success : false,
        message : `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        success : false,
        message : `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
      });
    }

    if (date && !isValidDate(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const updateData = {};
    if (topic      !== undefined) updateData.topic      = topic.trim();
    if (category   !== undefined) updateData.category   = category;
    if (notes      !== undefined) updateData.notes      = notes;
    if (resources  !== undefined) updateData.resources  = Array.isArray(resources) ? resources : [];
    if (timeSpent  !== undefined) updateData.timeSpent  = Number(timeSpent);
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (date       !== undefined) updateData.date       = new Date(date);

    const log = await updateLearningLogInDB(id, updateData);

    return res.json({ success: true, data: log });
  } catch (err) {
    console.error('updateLearningLog error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteLearningLog = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const existing = await findLearningLogById(id, userId);
    if (!existing) return res.status(404).json({ success: false, message: 'Learning log not found' });

    await deleteLearningLogInDB(id);

    return res.json({ success: true, message: 'Learning log deleted' });
  } catch (err) {
    console.error('deleteLearningLog error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getLearningStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    const last30Start = new Date();
    last30Start.setDate(last30Start.getDate() - 29);
    last30Start.setHours(0, 0, 0, 0);

    const monthLogs = await findLearningLogsByDateRange(userId, monthStart, new Date());

    const totalMinutesThisMonth = monthLogs.reduce((s, l) => s + (l.timeSpent || 0), 0);
    const totalHoursThisMonth   = +(totalMinutesThisMonth / 60).toFixed(2);

    const categoryMinutes = {};
    for (const log of monthLogs) {
      categoryMinutes[log.category] = (categoryMinutes[log.category] || 0) + (log.timeSpent || 0);
    }

    const hoursByCategory = Object.entries(categoryMinutes).map(([category, minutes]) => ({
      category,
      hours: +(minutes / 60).toFixed(2),
    }));

    const last30Logs = await findLearningLogsByDateRange(userId, last30Start, new Date());

    const dailyMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap[d.toISOString().split('T')[0]] = 0;
    }

    for (const log of last30Logs) {
      const key = new Date(log.date).toISOString().split('T')[0];
      if (key in dailyMap) {
        dailyMap[key] += log.timeSpent || 0;
      }
    }

    const dailyHoursLast30 = Object.entries(dailyMap)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, minutes]) => ({ date, hours: +(minutes / 60).toFixed(2) }));

    const topicRows = await db.LearningLog.findAll({
      where      : { userId },
      attributes : ['topic', [fn('SUM', col('timeSpent')), 'totalMinutes']],
      group      : ['topic'],
      order      : [[fn('SUM', col('timeSpent')), 'DESC']],
      limit      : 10,
      raw        : true,
    });

    const topTopics = topicRows.map((t) => ({
      topic     : t.topic,
      totalHours: +((t.totalMinutes || 0) / 60).toFixed(2),
    }));

    const difficultyWeights = { EASY: 1, MEDIUM: 2, HARD: 3 };
    const allLogs = await db.LearningLog.findAll({
      where      : { userId },
      attributes : ['difficulty'],
      raw        : true,
    });

    let avgDifficulty = null;
    if (allLogs.length > 0) {
      const sum = allLogs.reduce((s, l) => s + (difficultyWeights[l.difficulty] || 2), 0);
      const avg = sum / allLogs.length;
      avgDifficulty = avg <= 1.4 ? 'EASY' : avg <= 2.4 ? 'MEDIUM' : 'HARD';
    }

    return res.json({
      success: true,
      data: {
        totalHoursThisMonth,
        hoursByCategory,
        dailyHoursLast30,
        topTopics,
        averageDifficulty: avgDifficulty,
      },
    });
  } catch (err) {
    console.error('getLearningStats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { getLearningLogs, getLearningLog, createLearningLog, updateLearningLog, deleteLearningLog, getLearningStats };
