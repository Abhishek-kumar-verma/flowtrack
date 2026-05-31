import { createSession, findSessionById, updateSession } from '../repositories/pomodoroRepository.js';
import db from '../models/index.js';
import { Op, fn, col } from 'sequelize';

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const weekStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const startSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId, duration = 25 } = req.body;

    if (Number(duration) <= 0) {
      return res.status(400).json({ success: false, message: 'duration must be greater than 0' });
    }

    if (taskId) {
      const task = await db.Task.findOne({ where: { id: taskId, userId } });
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
    }

    const session = await createSession({
      userId,
      taskId    : taskId ?? null,
      duration  : Number(duration),
      startedAt : new Date(),
      completed : false,
    });

    return res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error('startSession error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const endSession = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const existing = await findSessionById(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pomodoro session not found' });
    }

    if (existing.completed) {
      return res.status(400).json({ success: false, message: 'Session already completed' });
    }

    const session = await updateSession(id, {
      completed : true,
      endedAt   : new Date(),
    });

    return res.json({ success: true, data: session });
  } catch (err) {
    console.error('endSession error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getSessions = async (req, res) => {
  try {
    const userId         = req.user.id;
    const { start, end } = todayRange();

    const sessions = await db.PomodoroSession.findAll({
      where: { userId, startedAt: { [Op.between]: [start, end] } },
      include: [{ model: db.Task, attributes: ['id', 'title', 'priority', 'status'] }],
      order: [['startedAt', 'ASC']],
    });

    return res.json({ success: true, data: sessions, count: sessions.length });
  } catch (err) {
    console.error('getSessions error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const { start: dayStart, end: dayEnd } = todayRange();
    const wkStart = weekStart();

    const todaySessions = await db.PomodoroSession.findAll({
      where: {
        userId,
        completed : true,
        startedAt : { [Op.between]: [dayStart, dayEnd] },
      },
      attributes: ['duration'],
      raw: true,
    });

    const totalToday             = todaySessions.length;
    const totalFocusMinutesToday = todaySessions.reduce((s, s2) => s + (s2.duration || 0), 0);
    const totalFocusHoursToday   = +(totalFocusMinutesToday / 60).toFixed(2);

    const weekSessions = await db.PomodoroSession.findAll({
      where: {
        userId,
        completed : true,
        startedAt : { [Op.gte]: wkStart },
      },
      attributes: ['duration'],
      raw: true,
    });

    const totalThisWeek           = weekSessions.length;
    const totalFocusMinutesWeek   = weekSessions.reduce((s, s2) => s + (s2.duration || 0), 0);
    const totalFocusHoursThisWeek = +(totalFocusMinutesWeek / 60).toFixed(2);

    const allResult = await db.PomodoroSession.findOne({
      where: { userId, completed: true },
      attributes: [
        [fn('SUM', col('duration')), 'totalDuration'],
        [fn('COUNT', col('id')), 'totalCount'],
      ],
      raw: true,
    });

    const totalDuration  = Number(allResult?.totalDuration) || 0;
    const totalAllTime   = Number(allResult?.totalCount) || 0;
    const totalFocusHours = +(totalDuration / 60).toFixed(2);

    return res.json({
      success: true,
      data: {
        totalToday,
        totalFocusHoursToday,
        totalThisWeek,
        totalFocusHoursThisWeek,
        totalAllTime,
        totalFocusHours,
      },
    });
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { startSession, endSession, getSessions, getStats };
