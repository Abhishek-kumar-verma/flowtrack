import { Op } from 'sequelize';
import {
  findGymLogs,
  findGymLogById,
  createGymLog as createGymLogInDB,
  updateGymLog as updateGymLogInDB,
  deleteGymLog as deleteGymLogInDB,
  findGymLogsByDateRange,
  findAllGymBodyParts,
  findAllGymLogDates,
  findTodaysGymLog,
} from '../repositories/gymRepository.js';

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getWeekStart = (date) => {
  const d   = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isValidDate = (str) => {
  const d = new Date(str);
  return !isNaN(d.getTime());
};

const getGymLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

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

    if (startDate && endDate) {
      where.date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      where.date = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.date = { [Op.lte]: new Date(endDate) };
    }

    const { count: total, rows: logs } = await findGymLogs({
      where,
      offset: skip,
      limit : limitNum,
    });

    return res.json({
      success    : true,
      data       : logs,
      pagination : { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('getGymLogs error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getGymLog = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const log = await findGymLogById(id, userId);

    if (!log) return res.status(404).json({ success: false, message: 'Gym log not found' });

    return res.json({ success: true, data: log });
  } catch (err) {
    console.error('getGymLog error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createGymLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bodyPart, date, duration, caloriesBurned, notes, exercises = [] } = req.body;

    if (!bodyPart || !date || !duration) {
      return res.status(400).json({
        success : false,
        message : 'bodyPart, date, and duration are required',
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    if (!Array.isArray(exercises)) {
      return res.status(400).json({ success: false, message: 'exercises must be an array' });
    }

    const log = await createGymLogInDB(
      {
        userId,
        bodyPart,
        date           : new Date(date),
        duration       : Number(duration),
        caloriesBurned : caloriesBurned ? Number(caloriesBurned) : null,
        notes          : notes ?? null,
      },
      exercises.map((ex) => ({
        name   : ex.name,
        sets   : Number(ex.sets),
        reps   : Number(ex.reps),
        weight : ex.weight != null ? Number(ex.weight) : null,
      })),
    );

    return res.status(201).json({ success: true, data: log });
  } catch (err) {
    console.error('createGymLog error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateGymLog = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const existing = await findGymLogById(id, userId);
    if (!existing) return res.status(404).json({ success: false, message: 'Gym log not found' });

    const { bodyPart, date, duration, caloriesBurned, notes, exercises } = req.body;

    if (date && !isValidDate(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const updateData = {};
    if (bodyPart       !== undefined) updateData.bodyPart       = bodyPart;
    if (date           !== undefined) updateData.date           = new Date(date);
    if (duration       !== undefined) updateData.duration       = Number(duration);
    if (caloriesBurned !== undefined) updateData.caloriesBurned = caloriesBurned != null ? Number(caloriesBurned) : null;
    if (notes          !== undefined) updateData.notes          = notes;

    const mappedExercises = Array.isArray(exercises)
      ? exercises.map((ex) => ({
          name   : ex.name,
          sets   : Number(ex.sets),
          reps   : Number(ex.reps),
          weight : ex.weight != null ? Number(ex.weight) : null,
        }))
      : undefined;

    const log = await updateGymLogInDB(id, updateData, mappedExercises);

    return res.json({ success: true, data: log });
  } catch (err) {
    console.error('updateGymLog error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteGymLog = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const existing = await findGymLogById(id, userId);
    if (!existing) return res.status(404).json({ success: false, message: 'Gym log not found' });

    await deleteGymLogInDB(id);

    return res.json({ success: true, message: 'Gym log deleted' });
  } catch (err) {
    console.error('deleteGymLog error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getGymStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    const thisMonthLogs = await findGymLogsByDateRange(userId, monthStart, new Date());

    const totalWorkoutsThisMonth = thisMonthLogs.length;
    const totalDurationThisMonth = thisMonthLogs.reduce((sum, l) => sum + (l.duration || 0), 0);

    const allBodyPartLogs = await findAllGymBodyParts(userId);

    const bodyPartCounts = {};
    for (const log of allBodyPartLogs) {
      const bp = log.bodyPart;
      bodyPartCounts[bp] = (bodyPartCounts[bp] || 0) + 1;
    }

    const mostTrainedBodyParts = Object.entries(bodyPartCounts)
      .map(([bodyPart, count]) => ({ bodyPart, count }))
      .sort((a, b) => b.count - a.count);

    const allLogDates = await findAllGymLogDates(userId);

    const uniqueDays = [
      ...new Set(
        allLogDates.map((l) => new Date(l.date).toISOString().split('T')[0]),
      ),
    ].sort((a, b) => (a > b ? -1 : 1));

    let currentStreak = 0;
    {
      const todayStr     = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
        const checkDate = new Date(uniqueDays[0]);
        for (const dayStr of uniqueDays) {
          const expected = checkDate.toISOString().split('T')[0];
          if (dayStr === expected) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    eightWeeksAgo.setHours(0, 0, 0, 0);

    const recentLogs = await findGymLogsByDateRange(userId, eightWeeksAgo, new Date());

    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = getWeekStart(new Date(Date.now() - i * 7 * 86400000));
      const weekEnd   = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      weeks.push({ weekStart, weekEnd, count: 0 });
    }

    for (const log of recentLogs) {
      const logDate = new Date(log.date);
      for (const week of weeks) {
        if (logDate >= week.weekStart && logDate <= week.weekEnd) {
          week.count++;
          break;
        }
      }
    }

    const workoutsPerWeek = weeks.map((w) => ({
      weekStart : w.weekStart.toISOString().split('T')[0],
      weekEnd   : w.weekEnd.toISOString().split('T')[0],
      count     : w.count,
    }));

    return res.json({
      success: true,
      data: {
        totalWorkoutsThisMonth,
        totalDurationThisMonth,
        currentStreak,
        mostTrainedBodyParts,
        workoutsPerWeek,
      },
    });
  } catch (err) {
    console.error('getGymStats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTodaysWorkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = todayRange();

    const log = await findTodaysGymLog(userId, start, end);

    return res.json({ success: true, data: log ?? null });
  } catch (err) {
    console.error('getTodaysWorkout error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { getGymLogs, getGymLog, createGymLog, updateGymLog, deleteGymLog, getGymStats, getTodaysWorkout };
