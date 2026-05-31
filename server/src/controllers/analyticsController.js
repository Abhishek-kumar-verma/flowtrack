import { Op, fn, col, literal } from 'sequelize';
import db from '../models/index.js';

function daysAgo(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeStreaks(dateSetsArray) {
  const uniqueDates = [...new Set(dateSetsArray)].sort();
  if (uniqueDates.length === 0) return { current: 0, longest: 0 };

  const today = formatDate(new Date());

  let longest = 1;
  let current = 1;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      tempStreak++;
      if (tempStreak > longest) longest = tempStreak;
    } else {
      tempStreak = 1;
    }
  }

  const lastActive = uniqueDates[uniqueDates.length - 1];
  if (lastActive === today || lastActive === formatDate(daysAgo(1))) {
    current = 1;
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const curr = new Date(uniqueDates[i + 1]);
      const prev = new Date(uniqueDates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  } else {
    current = 0;
  }

  if (tempStreak > longest) longest = tempStreak;

  return { current, longest };
}

async function getOverallStats(req, res) {
  try {
    const userId = req.user.id;

    const weekStart = daysAgo(6);
    const monthStart = daysAgo(29);

    const [
      totalTasks,
      completedTasksCount,
      pomodoroSum,
      learningSum,
      gymCount,
      completedTaskDates,
      weekTasks,
      weekGym,
      weekLearning,
      weekHabits,
      weekHabitTotal,
      monthTasks,
      monthGym,
      monthLearning,
    ] = await Promise.all([
      db.Task.count({ where: { userId } }),
      db.Task.count({ where: { userId, status: 'COMPLETED' } }),
      db.PomodoroSession.findOne({
        where: { userId, completed: true },
        attributes: [[fn('SUM', col('duration')), 'total']],
        raw: true,
      }),
      db.LearningLog.findOne({
        where: { userId },
        attributes: [[fn('SUM', col('timeSpent')), 'total']],
        raw: true,
      }),
      db.GymLog.count({ where: { userId } }),
      db.Task.findAll({
        where: { userId, status: 'COMPLETED' },
        attributes: ['updatedAt'],
        raw: true,
      }),
      db.Task.findAll({
        where: { userId, createdAt: { [Op.gte]: weekStart } },
        attributes: ['status'],
        raw: true,
      }),
      db.GymLog.count({ where: { userId, date: { [Op.gte]: formatDate(weekStart) } } }),
      db.LearningLog.findOne({
        where: { userId, date: { [Op.gte]: formatDate(weekStart) } },
        attributes: [[fn('SUM', col('timeSpent')), 'total']],
        raw: true,
      }),
      db.HabitLog.count({ where: { userId, date: { [Op.gte]: formatDate(weekStart) } } }),
      db.Habit.count({ where: { userId } }),
      db.Task.findAll({
        where: { userId, createdAt: { [Op.gte]: monthStart } },
        attributes: ['status'],
        raw: true,
      }),
      db.GymLog.count({ where: { userId, date: { [Op.gte]: formatDate(monthStart) } } }),
      db.LearningLog.findOne({
        where: { userId, date: { [Op.gte]: formatDate(monthStart) } },
        attributes: [[fn('SUM', col('timeSpent')), 'total']],
        raw: true,
      }),
    ]);

    const taskDateStrings = completedTaskDates.map((t) =>
      formatDate(new Date(t.updatedAt)),
    );
    const { current: currentStreak, longest: longestStreak } =
      computeStreaks(taskDateStrings);

    const weekCompleted = weekTasks.filter((t) => t.status === 'COMPLETED').length;
    const weekTotal = weekTasks.length;
    const weekTaskRate = weekTotal > 0 ? weekCompleted / weekTotal : 0;
    const weekLearningHours = (Number(weekLearning?.total) || 0) / 60;
    const weekHabitRate =
      weekHabitTotal > 0 ? weekHabits / (weekHabitTotal * 7) : 0;

    const thisWeekProductivity = Math.round(
      weekTaskRate * 40 +
        Math.min(weekGym / 5, 1) * 20 +
        Math.min(weekLearningHours / 7, 1) * 20 +
        Math.min(weekHabitRate, 1) * 20,
    );

    const monthCompleted = monthTasks.filter((t) => t.status === 'COMPLETED').length;
    const monthTotal = monthTasks.length;
    const monthTaskRate = monthTotal > 0 ? monthCompleted / monthTotal : 0;
    const monthLearningHours = (Number(monthLearning?.total) || 0) / 60;

    const monthHabitLogCount = weekHabitTotal > 0
      ? await db.HabitLog.count({ where: { userId, date: { [Op.gte]: formatDate(monthStart) } } })
      : 0;
    const monthHabitRate =
      weekHabitTotal > 0 ? monthHabitLogCount / (weekHabitTotal * 30) : 0;

    const thisMonthProductivity = Math.round(
      monthTaskRate * 40 +
        Math.min(monthGym / 20, 1) * 20 +
        Math.min(monthLearningHours / 30, 1) * 20 +
        Math.min(monthHabitRate, 1) * 20,
    );

    return res.status(200).json({
      success: true,
      data: {
        totalTasks,
        completedTasks: completedTasksCount,
        completionRate:
          totalTasks > 0
            ? Math.round((completedTasksCount / totalTasks) * 100)
            : 0,
        currentStreak,
        longestStreak,
        totalFocusHours:
          Math.round(((Number(pomodoroSum?.total) || 0) / 60) * 10) / 10,
        totalLearningHours:
          Math.round(((Number(learningSum?.total) || 0) / 60) * 10) / 10,
        totalGymSessions: gymCount,
        thisWeekProductivity: Math.min(thisWeekProductivity, 100),
        thisMonthProductivity: Math.min(thisMonthProductivity, 100),
      },
    });
  } catch (error) {
    console.error('[Analytics] getOverallStats error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch overall stats.',
    });
  }
}

async function getTaskAnalytics(req, res) {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = daysAgo(30);
    const now = new Date();

    const [tasks, overdueTasks, categoryGroups, priorityGroups] =
      await Promise.all([
        db.Task.findAll({
          where: { userId },
          attributes: ['status', 'category', 'priority', 'timeSpent', 'createdAt', 'updatedAt'],
          raw: true,
        }),
        db.Task.count({
          where: {
            userId,
            status: { [Op.notIn]: ['COMPLETED', 'CANCELLED'] },
            deadline: { [Op.lt]: now },
          },
        }),
        db.Task.findAll({
          where: { userId },
          attributes: ['category', [fn('COUNT', col('id')), 'count']],
          group: ['category'],
          raw: true,
        }),
        db.Task.findAll({
          where: { userId },
          attributes: ['priority', [fn('COUNT', col('id')), 'count']],
          group: ['priority'],
          raw: true,
        }),
      ]);

    const categoryCompletedMap = {};
    tasks.forEach((t) => {
      if (!categoryCompletedMap[t.category]) {
        categoryCompletedMap[t.category] = { count: 0, completed: 0 };
      }
      categoryCompletedMap[t.category].count++;
      if (t.status === 'COMPLETED') categoryCompletedMap[t.category].completed++;
    });

    const byCategory = categoryGroups.map((g) => ({
      category: g.category,
      count: Number(g.count),
      completed: categoryCompletedMap[g.category]?.completed ?? 0,
    }));

    const priorityCompletedMap = {};
    tasks.forEach((t) => {
      if (!priorityCompletedMap[t.priority]) {
        priorityCompletedMap[t.priority] = { count: 0, completed: 0 };
      }
      priorityCompletedMap[t.priority].count++;
      if (t.status === 'COMPLETED') priorityCompletedMap[t.priority].completed++;
    });

    const byPriority = priorityGroups.map((g) => ({
      priority: g.priority,
      count: Number(g.count),
      completed: priorityCompletedMap[g.priority]?.completed ?? 0,
    }));

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      last30Days.push({ date: formatDate(d), start: d, end: dayEnd });
    }

    const completionTrend = last30Days.map(({ date, start, end }) => {
      const dayCreated = tasks.filter(
        (t) => new Date(t.createdAt) >= start && new Date(t.createdAt) <= end,
      );
      const dayCompleted = tasks.filter(
        (t) => t.status === 'COMPLETED' && new Date(t.updatedAt) >= start && new Date(t.updatedAt) <= end,
      ).length;
      const rate =
        dayCreated.length > 0
          ? Math.round((dayCompleted / dayCreated.length) * 100)
          : null;
      return { date, total: dayCreated.length, completed: dayCompleted, rate };
    });

    const completedWithTime = tasks.filter(
      (t) => t.status === 'COMPLETED' && t.timeSpent > 0,
    );
    const averageTimePerTask =
      completedWithTime.length > 0
        ? Math.round(
            completedWithTime.reduce((a, t) => a + t.timeSpent, 0) /
              completedWithTime.length,
          )
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        byCategory,
        byPriority,
        completionTrend,
        averageTimePerTask,
        overdueCount: overdueTasks,
      },
    });
  } catch (error) {
    console.error('[Analytics] getTaskAnalytics error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch task analytics.',
    });
  }
}

async function getProductivityTrend(req, res) {
  try {
    const userId = req.user.id;
    const period = req.query.period || 'week';

    const periodDays = { week: 7, month: 30, year: 365 };
    if (!(period in periodDays)) {
      return res.status(400).json({
        success: false,
        message: `Invalid period. Must be one of: ${Object.keys(periodDays).join(', ')}`,
      });
    }
    const days = periodDays[period];
    const startDate = daysAgo(days - 1);

    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      buckets.push({ dateStr: formatDate(d), start: d, end: dayEnd });
    }

    const [tasks, gymLogs, learningLogs, habitLogs, habitsCount] = await Promise.all([
      db.Task.findAll({
        where: { userId, createdAt: { [Op.gte]: startDate } },
        attributes: ['status', 'createdAt'],
        raw: true,
      }),
      db.GymLog.findAll({
        where: { userId, date: { [Op.gte]: formatDate(startDate) } },
        attributes: ['date'],
        raw: true,
      }),
      db.LearningLog.findAll({
        where: { userId, date: { [Op.gte]: formatDate(startDate) } },
        attributes: ['date', 'timeSpent'],
        raw: true,
      }),
      db.HabitLog.findAll({
        where: { userId, date: { [Op.gte]: formatDate(startDate) } },
        attributes: ['date'],
        raw: true,
      }),
      db.Habit.count({ where: { userId } }),
    ]);

    const gymByDate = {};
    gymLogs.forEach((g) => {
      gymByDate[g.date] = true;
    });

    const learningByDate = {};
    learningLogs.forEach((l) => {
      learningByDate[l.date] = (learningByDate[l.date] || 0) + l.timeSpent;
    });

    const habitsByDate = {};
    habitLogs.forEach((h) => {
      habitsByDate[h.date] = (habitsByDate[h.date] || 0) + 1;
    });

    const scores = buckets.map(({ dateStr, start, end }) => {
      const dayTasks = tasks.filter(
        (t) => new Date(t.createdAt) >= start && new Date(t.createdAt) <= end,
      );
      const dayCompleted = dayTasks.filter((t) => t.status === 'COMPLETED').length;
      const taskRate = dayTasks.length > 0 ? dayCompleted / dayTasks.length : 0;

      const gymDone = gymByDate[dateStr] ? 1 : 0;
      const learningMinutes = learningByDate[dateStr] || 0;
      const learningRate = Math.min(learningMinutes / 60, 1);

      const habitsDone = habitsByDate[dateStr] || 0;
      const habitRate = habitsCount > 0 ? Math.min(habitsDone / habitsCount, 1) : 0;

      const score = Math.round(
        taskRate * 40 + gymDone * 20 + learningRate * 20 + habitRate * 20,
      );

      return {
        date: dateStr,
        score,
        breakdown: {
          taskScore: Math.round(taskRate * 40),
          gymScore: gymDone * 20,
          learningScore: Math.round(learningRate * 20),
          habitScore: Math.round(habitRate * 20),
        },
        meta: {
          tasksCompleted: dayCompleted,
          tasksTotal: dayTasks.length,
          hadGym: !!gymByDate[dateStr],
          learningMinutes,
          habitsCompleted: habitsDone,
          habitsExpected: habitsCount,
        },
      };
    });

    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length)
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        period,
        days,
        averageScore: avgScore,
        scores,
      },
    });
  } catch (error) {
    console.error('[Analytics] getProductivityTrend error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch productivity trend.',
    });
  }
}

async function getHeatmapData(req, res) {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year. Must be between 2000 and 2100.',
      });
    }

    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    const [completedTasks, gymLogs, learningLogs] = await Promise.all([
      db.Task.findAll({
        where: { userId, status: 'COMPLETED', updatedAt: { [Op.between]: [yearStart, yearEnd] } },
        attributes: ['updatedAt'],
        raw: true,
      }),
      db.GymLog.findAll({
        where: { userId, date: { [Op.between]: [formatDate(yearStart), formatDate(yearEnd)] } },
        attributes: ['date'],
        raw: true,
      }),
      db.LearningLog.findAll({
        where: { userId, date: { [Op.between]: [formatDate(yearStart), formatDate(yearEnd)] } },
        attributes: ['date'],
        raw: true,
      }),
    ]);

    const countByDate = {};

    completedTasks.forEach((t) => {
      const ds = formatDate(new Date(t.updatedAt));
      countByDate[ds] = (countByDate[ds] || 0) + 1;
    });

    gymLogs.forEach((g) => {
      countByDate[g.date] = (countByDate[g.date] || 0) + 1;
    });

    learningLogs.forEach((l) => {
      countByDate[l.date] = (countByDate[l.date] || 0) + 1;
    });

    const heatmap = [];
    const current = new Date(yearStart);
    while (current <= yearEnd) {
      const ds = formatDate(current);
      heatmap.push({ date: ds, count: countByDate[ds] || 0 });
      current.setDate(current.getDate() + 1);
    }

    const totalActiveDays = heatmap.filter((d) => d.count > 0).length;
    const maxCount = heatmap.reduce((m, d) => Math.max(m, d.count), 0);

    return res.status(200).json({
      success: true,
      data: {
        year,
        totalActiveDays,
        maxCount,
        heatmap,
      },
    });
  } catch (error) {
    console.error('[Analytics] getHeatmapData error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch heatmap data.',
    });
  }
}

async function getStreakData(req, res) {
  try {
    const userId = req.user.id;

    const [completedTaskDates, gymDates, learningDates, habitDates] =
      await Promise.all([
        db.Task.findAll({ where: { userId, status: 'COMPLETED' }, attributes: ['updatedAt'], raw: true }),
        db.GymLog.findAll({ where: { userId }, attributes: ['date'], raw: true }),
        db.LearningLog.findAll({ where: { userId }, attributes: ['date'], raw: true }),
        db.HabitLog.findAll({ where: { userId }, attributes: ['date'], raw: true }),
      ]);

    const taskDates = completedTaskDates.map((t) =>
      formatDate(new Date(t.updatedAt)),
    );
    const gymDateStrs = gymDates.map((g) => g.date);
    const learningDateStrs = learningDates.map((l) => l.date);
    const habitDateStrs = habitDates.map((h) => h.date);

    const allDates = [
      ...taskDates,
      ...gymDateStrs,
      ...learningDateStrs,
      ...habitDateStrs,
    ];

    const overall = computeStreaks(allDates);
    const taskStreaks = computeStreaks(taskDates);
    const gymStreaks = computeStreaks(gymDateStrs);
    const learningStreaks = computeStreaks(learningDateStrs);
    const habitStreaks = computeStreaks(habitDateStrs);

    return res.status(200).json({
      success: true,
      data: {
        currentStreak: overall.current,
        longestStreak: overall.longest,
        taskStreak: {
          current: taskStreaks.current,
          longest: taskStreaks.longest,
        },
        gymStreak: {
          current: gymStreaks.current,
          longest: gymStreaks.longest,
        },
        learningStreak: {
          current: learningStreaks.current,
          longest: learningStreaks.longest,
        },
        habitStreak: {
          current: habitStreaks.current,
          longest: habitStreaks.longest,
        },
      },
    });
  } catch (error) {
    console.error('[Analytics] getStreakData error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch streak data.',
    });
  }
}

export default { getOverallStats, getTaskAnalytics, getProductivityTrend, getHeatmapData, getStreakData };
