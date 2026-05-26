import cron from 'node-cron';
import { Op } from 'sequelize';
import { STATIC_QUOTES } from '../controllers/quotesController.js';
import { generateDailySummary, generateWeeklyReport } from '../services/openaiService.js';
import {
  User, Task, GymLog, GymExercise, LearningLog, HabitLog, MoodLog,
  PomodoroSession, DailyReport, Quote, Habit,
} from '../models/index.js';

const todayUTC = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const todayStr = (d = new Date()) => d.toISOString().split('T')[0];

const seedDailyQuote = async () => {
  try {
    const today = todayStr();
    const existing = await Quote.findOne({ where: { date: today }, attributes: ['id'] });
    if (existing) {
      console.log(`[cron] Daily quote already seeded for ${today}.`);
      return;
    }
    const picked = pickRandom(STATIC_QUOTES);
    await Quote.create({
      content: picked.content,
      author: picked.author ?? null,
      category: picked.category ?? null,
      date: today,
    });
    console.log(`[cron] Daily quote seeded: "${picked.content.slice(0, 60)}…"`);
  } catch (error) {
    console.error('[cron] seedDailyQuote error:', error);
  }
};

const generateDailyReports = async () => {
  try {
    const today = todayStr();
    const todayStart = todayUTC();
    const tomorrow = new Date(todayStart.getTime() + 86_400_000);

    console.log('[cron] Generating daily reports…');

    const allUsers = await User.findAll({ attributes: ['id'], raw: true });

    let processed = 0;

    for (const { id: userId } of allUsers) {
      try {
        const reportExists = await DailyReport.findOne({
          where: { userId, date: today },
          attributes: ['id'],
        });
        if (reportExists) continue;

        const [tasks, habitLogs, gymLogs, learningLogs, user, uniqueHabits, pomodoroCount] =
          await Promise.all([
            Task.findAll({
              where: {
                userId,
                [Op.or]: [
                  { deadline: { [Op.gte]: todayStart, [Op.lt]: tomorrow } },
                  {
                    status: { [Op.in]: ['COMPLETED', 'IN_PROGRESS'] },
                    updatedAt: { [Op.gte]: todayStart, [Op.lt]: tomorrow },
                  },
                ],
              },
              attributes: ['status', 'category', 'timeSpent'],
              raw: true,
            }),
            HabitLog.findAll({
              where: { userId, date: today },
              include: [{ model: Habit, as: 'habit', attributes: ['name', 'frequency'] }],
            }),
            GymLog.findAll({
              where: { userId, date: today },
              attributes: ['duration', 'bodyPart'],
              raw: true,
            }),
            LearningLog.findAll({
              where: { userId, date: today },
              attributes: ['timeSpent', 'topic', 'category'],
              raw: true,
            }),
            User.findByPk(userId, { attributes: ['name', 'dailyPriorities'], raw: true }),
            Habit.count({ where: { userId } }),
            PomodoroSession.count({
              where: { userId, completed: true, startedAt: { [Op.gte]: todayStart, [Op.lt]: tomorrow } },
            }),
          ]);

        const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
        const pendingTasks = tasks.filter(
          (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
        ).length;
        const totalTasks = tasks.length;

        const productivityScore =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 10 * 10) / 10 : 0;

        const habitsLoggedToday = new Set(habitLogs.map((h) => h.habitId)).size;
        const disciplineScore =
          uniqueHabits > 0
            ? Math.round((habitsLoggedToday / uniqueHabits) * 10 * 10) / 10
            : 0;

        const totalTimeSpent = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
        const timeManagementScore = Math.min(
          10,
          Math.round((totalTimeSpent / 240) * 10 * 10) / 10,
        );

        const focusScore = Math.min(10, Math.round((pomodoroCount / 8) * 10 * 10) / 10);

        const positiveHabits = habitLogs.map((h) => h.habit?.name).filter(Boolean);
        const weakAreas = [];
        if (productivityScore < 5) weakAreas.push('Task completion');
        if (disciplineScore < 5) weakAreas.push('Habit consistency');
        if (timeManagementScore < 3) weakAreas.push('Time management');
        if (focusScore < 3) weakAreas.push('Focus (Pomodoro sessions)');

        const suggestions = [];
        if (pendingTasks > 0) suggestions.push(`Complete ${pendingTasks} pending task(s) tomorrow.`);
        if (gymLogs.length === 0) suggestions.push('Consider a workout session tomorrow.');
        if (learningLogs.length === 0) suggestions.push('Dedicate at least 30 minutes to learning tomorrow.');
        if (pomodoroCount < 4) suggestions.push('Try to complete at least 4 Pomodoro sessions tomorrow.');

        const gymSummary =
          gymLogs.length > 0
            ? `Trained ${gymLogs.map((g) => g.bodyPart).join(', ')} for ${gymLogs.reduce((a, g) => a + g.duration, 0)} minutes.`
            : 'No gym session today.';

        const learningSummary =
          learningLogs.length > 0
            ? `Studied ${learningLogs.map((l) => l.topic).join(', ')} for ${learningLogs.reduce((a, l) => a + l.timeSpent, 0)} minutes.`
            : 'No learning logged today.';

        const aiSummary = [
          `Daily report for ${user?.name ?? 'user'} on ${today}.`,
          `Completed ${completedTasks}/${totalTasks} tasks. Productivity score: ${productivityScore}/10.`,
          gymSummary,
          learningSummary,
        ].join(' ');

        await DailyReport.upsert({
          userId,
          date: today,
          completedTasks,
          pendingTasks,
          productivityScore,
          disciplineScore,
          timeManagementScore,
          focusScore,
          positiveHabits,
          weakAreas,
          suggestions,
          fitnessConsistency: gymSummary,
          learningGrowth: learningSummary,
          aiSummary,
        });

        processed++;
      } catch (innerError) {
        console.error(`[cron] Failed to generate report for user ${userId}:`, innerError);
      }
    }

    console.log(`[cron] Daily reports generated for ${processed} user(s).`);
  } catch (error) {
    console.error('[cron] generateDailyReports error:', error);
  }
};

const generateAIDailyReports = async () => {
  const ts = () => new Date().toISOString();
  console.log(`${ts()} [cron:ai-daily] Starting AI daily report generation…`);

  const today = todayStr();
  const todayStart = todayUTC();
  const tomorrow = new Date(todayStart.getTime() + 86_400_000);

  try {
    const users = await User.findAll({ attributes: ['id'], raw: true });
    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const { id: userId } of users) {
      try {
        const existing = await DailyReport.findOne({
          where: { userId, date: today },
          attributes: ['id', 'aiSummary'],
        });
        if (existing?.aiSummary) { skipped++; continue; }

        const [user, tasks, gymLog, learningLogs, habitLogs, moodLog, pomodoroSessions] =
          await Promise.all([
            User.findByPk(userId, { attributes: ['name', 'lifeGoal', 'dailyPriorities'], raw: true }),
            Task.findAll({
              where: { userId, createdAt: { [Op.gte]: todayStart, [Op.lt]: tomorrow } },
              attributes: ['id', 'title', 'category', 'priority', 'status', 'timeSpent'],
              raw: true,
            }),
            GymLog.findOne({
              where: { userId, date: today },
              include: [{ model: GymExercise, as: 'exercises' }],
            }),
            LearningLog.findAll({
              where: { userId, date: today },
              attributes: ['topic', 'category', 'timeSpent', 'difficulty'],
              raw: true,
            }),
            HabitLog.findAll({
              where: { userId, date: today },
              attributes: ['habitId'],
              raw: true,
            }),
            MoodLog.findOne({
              where: { userId, date: today },
              attributes: ['mood', 'note'],
              raw: true,
            }),
            PomodoroSession.findAll({
              where: { userId, startedAt: { [Op.gte]: todayStart, [Op.lt]: tomorrow } },
              attributes: ['duration', 'completed'],
              raw: true,
            }),
          ]);

        if (!user) { skipped++; continue; }

        const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
        const pendingTasks = tasks.filter((t) => ['TODO', 'IN_PROGRESS'].includes(t.status));

        const hasActivity =
          tasks.length > 0 || gymLog || learningLogs.length > 0 || pomodoroSessions.length > 0;
        if (!hasActivity) { skipped++; continue; }

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

        await DailyReport.upsert({
          userId,
          date: today,
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

        generated++;
        console.log(`${ts()} [cron:ai-daily] AI report saved for user ${userId}.`);
      } catch (userErr) {
        failed++;
        console.error(`${ts()} [cron:ai-daily] Failed for user ${userId}:`, userErr.message);
      }
    }

    console.log(`${ts()} [cron:ai-daily] Done. Generated=${generated}, Skipped=${skipped}, Failed=${failed}.`);
  } catch (err) {
    console.error(`${new Date().toISOString()} [cron:ai-daily] Fatal error:`, err.message);
  }
};

const generateWeeklyReports = async () => {
  const ts = () => new Date().toISOString();
  console.log(`${ts()} [cron:weekly] Starting weekly report generation…`);

  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() + diffToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const wkStartStr = weekStart.toISOString().split('T')[0];
  const wkEndStr = weekEnd.toISOString().split('T')[0];

  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'lifeGoal'], raw: true });

    let generated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const [dailyReports, tasks, gymSessions, learningLogs, habitLogs, habitsCount] =
          await Promise.all([
            DailyReport.findAll({
              where: { userId: user.id, date: { [Op.between]: [wkStartStr, wkEndStr] } },
              order: [['date', 'ASC']],
            }),
            Task.findAll({
              where: { userId: user.id, createdAt: { [Op.between]: [weekStart, weekEnd] } },
              attributes: ['status', 'category'],
              raw: true,
            }),
            GymLog.count({
              where: { userId: user.id, date: { [Op.between]: [wkStartStr, wkEndStr] } },
            }),
            LearningLog.findAll({
              where: { userId: user.id, date: { [Op.between]: [wkStartStr, wkEndStr] } },
              attributes: ['timeSpent'],
              raw: true,
            }),
            HabitLog.count({
              where: { userId: user.id, date: { [Op.between]: [wkStartStr, wkEndStr] } },
            }),
            Habit.count({ where: { userId: user.id } }),
          ]);

        const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
        const learningHours =
          Math.round((learningLogs.reduce((a, l) => a + l.timeSpent, 0) / 60) * 10) / 10;
        const habitCompletionRate = habitsCount > 0 ? habitLogs / (habitsCount * 7) : 0;

        const report = await generateWeeklyReport({
          userName: user.name,
          lifeGoal: user.lifeGoal,
          dailyReports,
          taskStats: { total: tasks.length, completed: completedTasks },
          gymSessions,
          learningHours,
          habitCompletionRate,
        });

        await DailyReport.upsert({
          userId: user.id,
          date: wkStartStr,
          completedTasks,
          pendingTasks: tasks.length - completedTasks,
          productivityScore: report.weeklyProductivityScore ?? null,
          disciplineScore: report.disciplineScore ?? null,
          timeManagementScore: report.timeManagementScore ?? null,
          focusScore: report.focusScore ?? null,
          positiveHabits: report.positiveHabits ?? [],
          weakAreas: report.weakAreas ?? [],
          suggestions: report.suggestions ?? [],
          motivation: report.motivation ?? null,
          antiprocrastinationTip: report.antiProcrastinationTip ?? null,
          fitnessConsistency: report.fitnessConsistency ?? null,
          learningGrowth: report.learningGrowth ?? null,
          aiSummary: report.fullSummary ?? null,
        });

        console.log(`${ts()} [cron:weekly] User ${user.id}: score=${report.weeklyProductivityScore ?? 'N/A'}`);
        generated++;
      } catch (userErr) {
        failed++;
        console.error(`${ts()} [cron:weekly] Failed for user ${user.id}:`, userErr.message);
      }
    }

    console.log(`${ts()} [cron:weekly] Done. Generated=${generated}, Failed=${failed}.`);
  } catch (err) {
    console.error(`${new Date().toISOString()} [cron:weekly] Fatal error:`, err.message);
  }
};

const cleanStalePomodoroSessions = async () => {
  try {
    const cutoff = new Date(Date.now() - 25 * 60 * 1000);
    const [count] = await PomodoroSession.update(
      { endedAt: new Date(), completed: true },
      { where: { completed: false, startedAt: { [Op.lt]: cutoff } } },
    );
    if (count > 0) {
      console.log(`[cron] Closed ${count} stale Pomodoro session(s).`);
    }
  } catch (error) {
    console.error('[cron] cleanStalePomodoroSessions error:', error);
  }
};

export const startCronJobs = () => {
  cron.schedule('1 0 * * *', seedDailyQuote, { timezone: 'UTC', name: 'seed-daily-quote' });
  // non-AI daily at 23:30 IST (18:00 UTC) — runs first to generate base report
  cron.schedule('0 18 * * *', generateDailyReports, { timezone: 'UTC', name: 'generate-daily-reports' });
  cron.schedule('0 1 * * *', cleanStalePomodoroSessions, { timezone: 'UTC', name: 'clean-stale-pomodoro' });
  // AI daily at 23:45 IST (18:15 UTC) — runs after base report is ready
  cron.schedule('15 18 * * *', generateAIDailyReports, { timezone: 'UTC', name: 'ai-daily-reports' });
  cron.schedule('0 20 * * 0', generateWeeklyReports, { timezone: 'UTC', name: 'ai-weekly-reports' });

  console.log('[cron] All cron jobs registered.');
  seedDailyQuote();
};
