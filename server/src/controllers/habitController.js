import {
  findHabitsWithTodayLogs,
  createHabit as createHabitInDB,
  findHabitById,
  updateHabit as updateHabitInDB,
  deleteHabit as deleteHabitInDB,
  findHabitLogToday,
  createHabitLog,
  findHabitLogs,
  findHabitsWithLogs,
} from '../repositories/habitRepository.js';

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const dateStr = (d) => new Date(d).toISOString().split('T')[0];

const getHabits = async (req, res) => {
  try {
    const userId         = req.user.id;
    const { start, end } = todayRange();

    const habits = await findHabitsWithTodayLogs(userId, start, end);

    const data = habits.map((h) => ({
      ...h.toJSON ? h.toJSON() : h,
      completedToday : h.logs.length > 0,
      todayCount     : h.logs.length,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('getHabits error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createHabit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, frequency, targetCount } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const habit = await createHabitInDB({
      userId,
      name        : name.trim(),
      description : description ?? null,
      frequency   : frequency   ?? 'DAILY',
      targetCount : targetCount ? Number(targetCount) : 1,
    });

    return res.status(201).json({ success: true, data: habit });
  } catch (err) {
    console.error('createHabit error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateHabit = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const existing = await findHabitById(id, userId);
    if (!existing) return res.status(404).json({ success: false, message: 'Habit not found' });

    const { name, description, frequency, targetCount } = req.body;

    const updateData = {};
    if (name        !== undefined) updateData.name        = name.trim();
    if (description !== undefined) updateData.description = description;
    if (frequency   !== undefined) updateData.frequency   = frequency;
    if (targetCount !== undefined) updateData.targetCount = Number(targetCount);

    const habit = await updateHabitInDB(id, updateData);

    return res.json({ success: true, data: habit });
  } catch (err) {
    console.error('updateHabit error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const existing = await findHabitById(id, userId);
    if (!existing) return res.status(404).json({ success: false, message: 'Habit not found' });

    await deleteHabitInDB(id);

    return res.json({ success: true, message: 'Habit and its logs deleted' });
  } catch (err) {
    console.error('deleteHabit error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const logHabit = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const habit = await findHabitById(id, userId);
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    const { start, end } = todayRange();

    const existingLog = await findHabitLogToday(id, start, end);

    if (existingLog) {
      return res.status(409).json({
        success : false,
        message : 'Habit already logged for today',
        data    : existingLog,
      });
    }

    const log = await createHabitLog({
      habitId    : id,
      userId,
      date       : new Date().toISOString().split('T')[0],
      completedAt: new Date(),
    });

    return res.status(201).json({ success: true, data: log, message: 'Habit logged for today' });
  } catch (err) {
    console.error('logHabit error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getHabitStreak = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const habit = await findHabitById(id, userId);
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    const logs = await findHabitLogs(id, [['date', 'DESC']]);

    if (logs.length === 0) {
      return res.json({ success: true, data: { currentStreak: 0, longestStreak: 0 } });
    }

    const uniqueDays = [
      ...new Set(logs.map((l) => String(l.date).substring(0, 10))),
    ].sort((a, b) => (a > b ? -1 : 1));

    const todayS     = dateStr(new Date());
    const yesterdayS = dateStr(new Date(Date.now() - 86400000));

    let currentStreak = 0;
    if (uniqueDays[0] === todayS || uniqueDays[0] === yesterdayS) {
      const cursor = new Date(uniqueDays[0]);
      for (const day of uniqueDays) {
        if (day === dateStr(cursor)) {
          currentStreak++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const ascending = [...uniqueDays].sort();
    let longestStreak = 0;
    let streak        = 0;
    let prevDate      = null;

    for (const day of ascending) {
      if (!prevDate) {
        streak = 1;
      } else {
        const prev    = new Date(prevDate);
        const current = new Date(day);
        const diffMs  = current - prev;
        const diffDay = Math.round(diffMs / 86400000);

        if (diffDay === 1) {
          streak++;
        } else {
          streak = 1;
        }
      }
      if (streak > longestStreak) longestStreak = streak;
      prevDate = day;
    }

    return res.json({ success: true, data: { currentStreak, longestStreak } });
  } catch (err) {
    console.error('getHabitStreak error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getHabitsWithLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const habits = await findHabitsWithLogs(userId, thirtyDaysAgo);

    const data = habits.map((h) => ({
      id          : h.id,
      name        : h.name,
      description : h.description,
      frequency   : h.frequency,
      targetCount : h.targetCount,
      createdAt   : h.createdAt,
      logDates    : h.logs.map((l) => String(l.date).substring(0, 10)),
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('getHabitsWithLogs error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { getHabits, createHabit, updateHabit, deleteHabit, logHabit, getHabitStreak, getHabitsWithLogs };
