import cron from 'node-cron';
import { Op } from 'sequelize';
import { generateDailySummary, generateWeeklyReport } from '../services/openaiService.js';
import { STATIC_QUOTES } from '../controllers/quotesController.js';
import {
  User, Task, GymLog, GymExercise, LearningLog, HabitLog, MoodLog,
  PomodoroSession, DailyReport, Quote, Habit,
} from '../models/index.js';

const ts = () => new Date().toISOString();

function todayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const todayStr = (d = new Date()) => d.toISOString().split('T')[0];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function fetchUserDayData(userId, date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  const dateOnly = start.toISOString().split('T')[0];

  const [user, tasks, gymLog, learningLogs, habitLogs, moodLog, pomodoroSessions] =
    await Promise.all([
      User.findByPk(userId, { attributes: ['name', 'lifeGoal', 'dailyPriorities'], raw: true }),
      Task.findAll({
        where: { userId, createdAt: { [Op.gte]: start, [Op.lte]: end } },
        attributes: ['id', 'title', 'category', 'priority', 'status', 'timeSpent'],
        raw: true,
      }),
      GymLog.findOne({
        where: { userId, date: dateOnly },
        include: [{ model: GymExercise, as: 'exercises' }],
      }),
      LearningLog.findAll({
        where: { userId, date: dateOnly },
        attributes: ['topic', 'category', 'timeSpent', 'difficulty'],
        raw: true,
      }),
      HabitLog.findAll({
        where: { userId, date: dateOnly },
        attributes: ['habitId', 'completedAt'],
        raw: true,
      }),
      MoodLog.findOne({
        where: { userId, date: dateOnly },
        attributes: ['mood', 'note'],
        raw: true,
      }),
      PomodoroSession.findAll({
        where: { userId, startedAt: { [Op.gte]: start, [Op.lte]: end } },
        attributes: ['duration', 'completed'],
        raw: true,
      }),
    ]);

  if (!user) return null;

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const pendingTasks = tasks.filter((t) => ['TODO', 'IN_PROGRESS'].includes(t.status));

  return { user, completedTasks, pendingTasks, gymLog, learningLogs, habitLogs, moodLog, pomodoroSessions };
}

async function runDailyReportJob() {
  const jobName = '[CRON:daily-reports]';
  console.log(`${ts()} ${jobName} Starting daily report generation…`);

  const today = todayStr();
  const todayStart = todayUTC();

  try {
    const users = await User.findAll({ attributes: ['id'], raw: true });
    console.log(`${ts()} ${jobName} Found ${users.length} user(s).`);

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const { id: userId } of users) {
      try {
        const existingReport = await DailyReport.findOne({ where: { userId, date: today }, attributes: ['id'] });
        if (existingReport) { skipped++; continue; }

        const dayData = await fetchUserDayData(userId, todayStart);
        if (!dayData) { skipped++; continue; }

        const { user, completedTasks, pendingTasks, gymLog, learningLogs, habitLogs, moodLog, pomodoroSessions } = dayData;

        const hasActivity =
          completedTasks.length > 0 || pendingTasks.length > 0 || gymLog ||
          learningLogs.length > 0 || pomodoroSessions.length > 0;

        if (!hasActivity) {
          await DailyReport.create({
            userId,
            date: today,
            completedTasks: 0,
            pendingTasks: 0,
            productivityScore: 0,
            disciplineScore: 0,
            timeManagementScore: 0,
            focusScore: 0,
            positiveHabits: [],
            weakAreas: ['No activity logged today'],
            suggestions: ['Start by completing one small task tomorrow.'],
            motivation: 'Every day is a new opportunity to do better.',
            aiSummary: 'No activity was logged for this day.',
          });
          skipped++;
          continue;
        }

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
        console.log(`${ts()} ${jobName} Report saved for user ${userId}.`);
      } catch (userErr) {
        failed++;
        console.error(`${ts()} ${jobName} Failed for user ${userId}:`, userErr.message);
      }
    }

    console.log(`${ts()} ${jobName} Done. Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}.`);
  } catch (err) {
    console.error(`${ts()} ${jobName} Fatal error:`, err.message);
  }
}

async function runQuoteOfTheDayJob() {
  const jobName = '[CRON:quote-of-day]';
  console.log(`${ts()} ${jobName} Assigning quote of the day…`);

  const today = todayStr();

  try {
    const existing = await Quote.findOne({ where: { date: today }, attributes: ['id'] });
    if (existing) {
      console.log(`${ts()} ${jobName} Quote already assigned for today (id=${existing.id}). Skipping.`);
      return;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentQuoteContents = await Quote.findAll({
      where: { date: { [Op.gte]: sevenDaysAgoStr } },
      attributes: ['content'],
      raw: true,
    });
    const recentContents = new Set(recentQuoteContents.map((q) => q.content));

    const allDbQuotes = await Quote.findAll({ attributes: ['content', 'author', 'category'], raw: true });
    const freshDbQuotes = allDbQuotes.filter((q) => !recentContents.has(q.content));

    let picked;
    if (freshDbQuotes.length > 0) {
      picked = pickRandom(freshDbQuotes);
    } else {
      const freshStatic = STATIC_QUOTES.filter((q) => !recentContents.has(q.content));
      picked = freshStatic.length > 0 ? pickRandom(freshStatic) : pickRandom(STATIC_QUOTES);
    }

    const newQuote = await Quote.create({
      content: picked.content,
      author: picked.author || null,
      category: picked.category || null,
      date: today,
    });

    console.log(`${ts()} ${jobName} Quote assigned: "${newQuote.content.slice(0, 60)}…" (id=${newQuote.id})`);
  } catch (err) {
    console.error(`${ts()} ${jobName} Error:`, err.message);
  }
}

async function runWeeklyReportJob() {
  const jobName = '[CRON:weekly-reports]';
  console.log(`${ts()} ${jobName} Starting weekly report generation…`);

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

    console.log(`${ts()} ${jobName} Processing ${users.length} user(s) for week ${wkStartStr} → ${wkEndStr}.`);

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
            GymLog.count({ where: { userId: user.id, date: { [Op.between]: [wkStartStr, wkEndStr] } } }),
            LearningLog.findAll({
              where: { userId: user.id, date: { [Op.between]: [wkStartStr, wkEndStr] } },
              attributes: ['timeSpent'],
              raw: true,
            }),
            HabitLog.count({ where: { userId: user.id, date: { [Op.between]: [wkStartStr, wkEndStr] } } }),
            Habit.count({ where: { userId: user.id } }),
          ]);

        const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
        const learningHours = Math.round((learningLogs.reduce((a, l) => a + l.timeSpent, 0) / 60) * 10) / 10;
        const expectedHabitLogs = habitsCount * 7;
        const habitCompletionRate = expectedHabitLogs > 0 ? habitLogs / expectedHabitLogs : 0;

        const weeklyReport = await generateWeeklyReport({
          userName: user.name,
          lifeGoal: user.lifeGoal,
          dailyReports,
          taskStats: { total: tasks.length, completed: completedTasks },
          gymSessions,
          learningHours,
          habitCompletionRate,
        });

        console.log(`${ts()} ${jobName} Weekly report for user ${user.id}: score=${weeklyReport.weeklyProductivityScore ?? 'N/A'}`);
        generated++;
      } catch (userErr) {
        failed++;
        console.error(`${ts()} ${jobName} Failed for user ${user.id}:`, userErr.message);
      }
    }

    console.log(`${ts()} ${jobName} Done. Generated: ${generated}, Failed: ${failed}.`);
  } catch (err) {
    console.error(`${ts()} ${jobName} Fatal error:`, err.message);
  }
}

export function startCronJobs() {
  console.log(`${ts()} [CRON] Initialising cron jobs…`);

  cron.schedule('30 23 * * *', () => {
    runDailyReportJob().catch((err) =>
      console.error(`${ts()} [CRON:daily-reports] Uncaught error:`, err.message),
    );
  });
  console.log(`${ts()} [CRON] Job 1 registered: Daily reports at 23:30.`);

  cron.schedule('1 0 * * *', () => {
    runQuoteOfTheDayJob().catch((err) =>
      console.error(`${ts()} [CRON:quote-of-day] Uncaught error:`, err.message),
    );
  });
  console.log(`${ts()} [CRON] Job 2 registered: Quote of the day at 00:01.`);

  cron.schedule('0 20 * * 0', () => {
    runWeeklyReportJob().catch((err) =>
      console.error(`${ts()} [CRON:weekly-reports] Uncaught error:`, err.message),
    );
  });
  console.log(`${ts()} [CRON] Job 3 registered: Weekly reports on Sunday at 20:00.`);

  console.log(`${ts()} [CRON] All jobs started successfully.`);
}
