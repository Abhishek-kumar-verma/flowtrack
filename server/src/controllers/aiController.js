import { Op } from 'sequelize';
import db from '../models/index.js';
import { upsertReport, findReportByUserAndDate } from '../repositories/dailyReportRepository.js';
import {
  generateDailySummary,
  generateWeeklyReport,
  generateMotivationalQuote,
  generateChatResponse,
} from '../services/openaiService.js';

function toDateOnly(dateStr) {
  if (dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) throw new Error('Invalid date format. Use YYYY-MM-DD.');
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

async function fetchDailyData(userId, date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  const [tasks, gymLog, learningLogs, habitLogs, moodLog, pomodoroSessions, user] =
    await Promise.all([
      db.Task.findAll({
        where: { userId, createdAt: { [Op.between]: [start, end] } },
        attributes: ['id','title','category','priority','status','timeSpent','deadline'],
        raw: true,
      }),
      db.GymLog.findOne({
        where: { userId, date: start.toISOString().split('T')[0] },
        include: [{ model: db.GymExercise, as: 'exercises' }],
      }),
      db.LearningLog.findAll({
        where: { userId, date: start.toISOString().split('T')[0] },
        attributes: ['topic','category','timeSpent','difficulty'],
        raw: true,
      }),
      db.HabitLog.findAll({
        where: { userId, date: start.toISOString().split('T')[0] },
        attributes: ['habitId','completedAt'],
        raw: true,
      }),
      db.MoodLog.findOne({
        where: { userId, date: start.toISOString().split('T')[0] },
        attributes: ['mood','note'],
        raw: true,
      }),
      db.PomodoroSession.findAll({
        where: { userId, startedAt: { [Op.between]: [start, end] } },
        attributes: ['duration','completed'],
        raw: true,
      }),
      db.User.findByPk(userId, {
        attributes: ['name','lifeGoal','dailyPriorities'],
        raw: true,
      }),
    ]);

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const pendingTasks = tasks.filter((t) =>
    ['TODO', 'IN_PROGRESS'].includes(t.status),
  );

  return {
    user,
    tasks,
    completedTasks,
    pendingTasks,
    gymLog,
    learningLogs,
    habitLogs,
    moodLog,
    pomodoroSessions,
  };
}

async function generateDailySummaryHandler(req, res) {
  try {
    const userId = req.user.id;
    const date = toDateOnly(req.query.date || new Date());

    const data = await fetchDailyData(userId, date);
    const { user, completedTasks, pendingTasks, gymLog, learningLogs, habitLogs, moodLog, pomodoroSessions } =
      data;

    const aiResult = await generateDailySummary({
      userName: user.name,
      lifeGoal: user.lifeGoal,
      dailyPriorities: user.dailyPriorities,
      completedTasks,
      pendingTasks,
      gymLog,
      learningLogs,
      habitLogs,
      moodLog,
      pomodoroSessions,
    });

    const [report] = await upsertReport(userId, date.toISOString().split('T')[0], {
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      productivityScore: aiResult.productivityScore,
      disciplineScore: aiResult.disciplineScore,
      timeManagementScore: aiResult.timeManagementScore,
      focusScore: aiResult.focusScore,
      positiveHabits: aiResult.positiveHabits,
      weakAreas: aiResult.weakAreas,
      suggestions: aiResult.suggestions,
      motivation: aiResult.motivation,
      antiprocrastinationTip: aiResult.antiProcrastinationTip,
      fitnessConsistency: aiResult.fitnessConsistency,
      learningGrowth: aiResult.learningGrowth,
      aiSummary: aiResult.fullSummary,
    });

    return res.status(200).json({
      success: true,
      message: 'Daily summary generated successfully.',
      data: report,
    });
  } catch (error) {
    console.error('[AI] generateDailySummary error:', error.message);
    return res.status(500).json({
      success: false,
      message: (error?.status || error?.code) ? 'AI service is unavailable. Please try again later.' : 'Failed to generate daily summary.',
    });
  }
}

async function getDailyReport(req, res) {
  try {
    const userId = req.user.id;
    const date = toDateOnly(req.query.date);

    const existing = await findReportByUserAndDate(userId, date.toISOString().split('T')[0]);

    if (existing) {
      return res.status(200).json({
        success: true,
        data: { ...existing.toJSON(), aiGenerated: true },
      });
    }

    const { completedTasks, pendingTasks, gymLog, learningLogs, habitLogs, pomodoroSessions } =
      await fetchDailyData(userId, date);

    const totalFocusMinutes = pomodoroSessions
      .filter((s) => s.completed)
      .reduce((acc, s) => acc + s.duration, 0);

    const totalLearningMinutes = learningLogs.reduce(
      (acc, l) => acc + l.timeSpent,
      0,
    );

    const totalTasks = completedTasks.length + pendingTasks.length;
    const taskCompletionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;

    const productivityScore = Math.round(
      taskCompletionRate * 50 +
        (gymLog ? 15 : 0) +
        Math.min(totalLearningMinutes / 120, 1) * 15 +
        Math.min(pomodoroSessions.filter((s) => s.completed).length / 4, 1) * 20,
    );

    return res.status(200).json({
      success: true,
      data: {
        userId,
        date,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        productivityScore,
        disciplineScore: null,
        timeManagementScore: null,
        focusScore: Math.min(
          Math.round(pomodoroSessions.filter((s) => s.completed).length * 25),
          100,
        ),
        totalFocusMinutes,
        totalLearningMinutes,
        hadGymSession: !!gymLog,
        habitLogsCount: habitLogs.length,
        aiSummary: null,
        aiGenerated: false,
        message: 'No AI report generated yet. Call POST /ai/daily-summary to generate one.',
      },
    });
  } catch (error) {
    console.error('[AI] getDailyReport error:', error.message);
    return res.status(500).json({
      success: false,
      message: (error?.status || error?.code) ? 'AI service is unavailable. Please try again later.' : 'Failed to fetch daily report.',
    });
  }
}

async function getWeeklyReport(req, res) {
  try {
    const userId = req.user.id;

    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + diffToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const dailyReports = await db.DailyReport.findAll({
      where: { userId, date: { [Op.between]: [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]] } },
      order: [['date', 'ASC']],
    });

    const [tasks, gymSessions, learningLogs, habitLogs, habits] = await Promise.all([
      db.Task.findAll({
        where: { userId, createdAt: { [Op.between]: [weekStart, weekEnd] } },
        attributes: ['status','category'],
        raw: true,
      }),
      db.GymLog.count({ where: { userId, date: { [Op.between]: [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]] } } }),
      db.LearningLog.findAll({
        where: { userId, date: { [Op.between]: [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]] } },
        attributes: ['timeSpent'],
        raw: true,
      }),
      db.HabitLog.count({ where: { userId, date: { [Op.between]: [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]] } } }),
      db.Habit.count({ where: { userId } }),
    ]);

    const user = await db.User.findByPk(userId, { attributes: ['name','lifeGoal'], raw: true });

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const totalLearningMinutes = learningLogs.reduce((a, l) => a + l.timeSpent, 0);
    const learningHours = Math.round((totalLearningMinutes / 60) * 10) / 10;

    const expectedHabitLogs = habits * 7;
    const habitCompletionRate =
      expectedHabitLogs > 0 ? habitLogs / expectedHabitLogs : 0;

    const weeklyData = {
      userName: user.name,
      lifeGoal: user.lifeGoal,
      dailyReports,
      taskStats: { total: tasks.length, completed: completedTasks },
      gymSessions,
      learningHours,
      habitCompletionRate,
    };

    let aiReport = null;
    try {
      aiReport = await generateWeeklyReport(weeklyData);
    } catch (err) {
      console.error('[AI] Weekly report AI call failed:', err.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        weekStart,
        weekEnd,
        rawStats: {
          totalTasks: tasks.length,
          completedTasks,
          gymSessions,
          learningHours,
          habitCompletionRate: Math.round(habitCompletionRate * 100),
          daysWithReports: dailyReports.length,
        },
        dailyReports,
        aiReport,
      },
    });
  } catch (error) {
    console.error('[AI] getWeeklyReport error:', error.message);
    return res.status(500).json({
      success: false,
      message: (error?.status || error?.code) ? 'AI service is unavailable. Please try again later.' : 'Failed to generate weekly report.',
    });
  }
}

async function chatWithAI(req, res) {
  try {
    const userId = req.user.id;
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'message is required and must be a non-empty string.',
      });
    }

    const safeHistory = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter(
            (m) =>
              m &&
              ['user', 'assistant'].includes(m.role) &&
              typeof m.content === 'string',
          )
          .slice(-10)
      : [];

    const date = toDateOnly();
    const [completedCount, pomodoroCount] = await Promise.all([
      db.Task.count({ where: { userId, status: 'COMPLETED', updatedAt: { [Op.gte]: date } } }),
      db.PomodoroSession.count({ where: { userId, completed: true, startedAt: { [Op.gte]: date } } }),
    ]);

    const userContext = {
      userName: req.user.name,
      lifeGoal: req.user.lifeGoal,
      dailyPriorities: req.user.dailyPriorities,
      todayStats: { completedTasks: completedCount, pomodoroCount },
    };

    const messages = [...safeHistory, { role: 'user', content: message.trim() }];

    const { reply } = await generateChatResponse(messages, userContext);

    return res.status(200).json({
      success: true,
      data: {
        reply,
        conversationHistory: [
          ...messages,
          { role: 'assistant', content: reply },
        ],
      },
    });
  } catch (error) {
    console.error('[AI] chatWithAI error:', error.message);
    return res.status(500).json({
      success: false,
      message: (error?.status || error?.code) ? 'AI service is unavailable. Please try again later.' : 'Failed to get AI response.',
    });
  }
}

async function generateQuoteForUser(req, res) {
  try {
    const { lifeGoal, name } = req.user;

    const result = await generateMotivationalQuote(lifeGoal);

    return res.status(200).json({
      success: true,
      data: {
        userName: name,
        lifeGoal: lifeGoal || null,
        ...result,
      },
    });
  } catch (error) {
    console.error('[AI] generateQuoteForUser error:', error.message);
    return res.status(500).json({
      success: false,
      message: (error?.status || error?.code) ? 'AI service is unavailable. Please try again later.' : 'Failed to generate motivational quote.',
    });
  }
}

export default { generateDailySummaryHandler, getDailyReport, getWeeklyReport, chatWithAI, generateQuoteForUser };
