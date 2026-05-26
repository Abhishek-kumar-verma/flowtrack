import { Op, fn, col } from 'sequelize';
import { findUserById, updateUser } from '../repositories/userRepository.js';
import db from '../models/index.js';

const todayIST = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgoIST = (n) => {
  const d = todayIST();
  d.setDate(d.getDate() - n);
  return d;
};

const calculateStreak = async (userId) => {
  const logs = await db.HabitLog.findAll({
    where: { userId },
    attributes: ['date'],
    group: ['date'],
    order: [['date', 'DESC']],
    raw: true,
  });

  if (logs.length === 0) return 0;

  const today = todayIST();
  const yesterday = daysAgoIST(1);
  const mostRecentDate = new Date(logs[0].date);
  mostRecentDate.setUTCHours(0, 0, 0, 0);

  const isCurrent =
    mostRecentDate.getTime() === today.getTime() ||
    mostRecentDate.getTime() === yesterday.getTime();

  if (!isCurrent) return 0;

  let streak = 1;
  let expectedDate = new Date(mostRecentDate);
  expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);

  for (let i = 1; i < logs.length; i++) {
    const logDate = new Date(logs[i].date);
    logDate.setUTCHours(0, 0, 0, 0);
    if (logDate.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [user, taskCounts, totalLearningTime, gymSessionCount, streak] = await Promise.all([
      findUserById(userId),
      db.Task.findAll({
        where: { userId },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      db.LearningLog.findOne({
        where: { userId },
        attributes: [[fn('SUM', col('timeSpent')), 'total']],
        raw: true,
      }),
      db.GymLog.count({ where: { userId } }),
      calculateStreak(userId),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const taskStats = {
      total: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    for (const group of taskCounts) {
      taskStats[group.status] = Number(group.count);
      taskStats.total += Number(group.count);
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user.toJSON(),
        stats: {
          tasks: taskStats,
          currentStreak: streak,
          totalLearningMinutes: Number(totalLearningTime?.total) || 0,
          totalGymSessions: gymSessionCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, lifeGoal, dailyPriorities } = req.body;

    const updateData = {};

    if (typeof name === 'string' && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    if (typeof lifeGoal !== 'undefined') {
      updateData.lifeGoal = typeof lifeGoal === 'string' ? lifeGoal.trim() || null : null;
    }

    if (Array.isArray(dailyPriorities)) {
      updateData.dailyPriorities = dailyPriorities.filter(
        (p) => typeof p === 'string' && p.trim().length > 0
      );
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update.',
      });
    }

    const updatedUser = await updateUser(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = todayIST();
    const sevenDaysAgo = daysAgoIST(7);

    const [
      todayTasks,
      todayGymLogs,
      todayLearningLogs,
      todayMoodLog,
      weeklyReports,
      activePomodoroSession,
      streak,
    ] = await Promise.all([
      db.Task.findAll({
        where: {
          userId,
          status: { [Op.ne]: 'CANCELLED' },
          [Op.or]: [
            { deadline: { [Op.gte]: today, [Op.lt]: new Date(today.getTime() + 86_400_000) } },
            { deadline: null, status: { [Op.in]: ['TODO', 'IN_PROGRESS'] } },
          ],
        },
        order: [['priority', 'DESC'], ['createdAt', 'ASC']],
      }),
      db.GymLog.findAll({
        where: { userId, date: today.toISOString().split('T')[0] },
        include: [{ model: db.GymExercise, as: 'exercises' }],
        order: [['createdAt', 'DESC']],
      }),
      db.LearningLog.findAll({
        where: { userId, date: today.toISOString().split('T')[0] },
        order: [['createdAt', 'DESC']],
      }),
      db.MoodLog.findOne({
        where: { userId, date: today.toISOString().split('T')[0] },
        order: [['createdAt', 'DESC']],
      }),
      db.DailyReport.findAll({
        where: { userId, date: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] } },
        attributes: ['date','productivityScore','disciplineScore','focusScore','timeManagementScore','completedTasks','pendingTasks'],
        order: [['date', 'ASC']],
      }),
      db.PomodoroSession.findOne({
        where: { userId, completed: false },
        include: [{ model: db.Task, attributes: ['id', 'title'] }],
        order: [['startedAt', 'DESC']],
      }),
      calculateStreak(userId),
    ]);

    const taskSummary = {
      total: todayTasks.length,
      completed: todayTasks.filter((t) => t.status === 'COMPLETED').length,
      inProgress: todayTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      todo: todayTasks.filter((t) => t.status === 'TODO').length,
    };

    return res.status(200).json({
      success: true,
      dashboard: {
        date: today,
        tasks: {
          summary: taskSummary,
          items: todayTasks,
        },
        gym: todayGymLogs,
        learning: todayLearningLogs,
        mood: todayMoodLog,
        weeklyChart: weeklyReports,
        activePomodoro: activePomodoroSession,
        currentStreak: streak,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getProfile, updateProfile, getDashboardStats };
