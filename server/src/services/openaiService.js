import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely call OpenAI and return parsed JSON.
 * Falls back to an empty object if parsing fails so callers always get a shape.
 */
async function callJSON(messages, model = 'gpt-3.5-turbo') {
  const response = await openai.chat.completions.create({
    model,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1500,
  });

  const text = response.choices[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/**
 * Regular (non-JSON) completion — used for conversational replies.
 */
async function callText(messages, model = 'gpt-3.5-turbo') {
  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.8,
    max_tokens: 800,
  });
  return response.choices[0]?.message?.content?.trim() ?? '';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * generateDailySummary(userData)
 *
 * userData = {
 *   userName, lifeGoal, dailyPriorities,
 *   completedTasks[], pendingTasks[],
 *   gymLog, learningLogs[], habitLogs[],
 *   moodLog, pomodoroSessions[]
 * }
 *
 * Returns {
 *   productivityScore, disciplineScore, timeManagementScore, focusScore,
 *   positiveHabits[], weakAreas[], suggestions[], motivation,
 *   antiProcrastinationTip, fitnessConsistency, learningGrowth, fullSummary
 * }
 */
export async function generateDailySummary(userData) {
  const {
    userName,
    lifeGoal,
    dailyPriorities = [],
    completedTasks = [],
    pendingTasks = [],
    gymLog,
    learningLogs = [],
    habitLogs = [],
    moodLog,
    pomodoroSessions = [],
  } = userData;

  const totalFocusMinutes = pomodoroSessions
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.duration, 0);

  const totalLearningMinutes = learningLogs.reduce(
    (acc, l) => acc + l.timeSpent,
    0,
  );

  const systemPrompt = `You are a personal productivity coach and life mentor.
Analyze the user's daily data and return a comprehensive JSON performance report.
Be honest but encouraging. Give actionable, specific insights — not generic advice.
All scores are 0-100. Return ONLY valid JSON with no extra text.`;

  const userPrompt = `
Analyze this daily progress data for ${userName}:

Life Goal: ${lifeGoal || 'Not set'}
Daily Priorities: ${dailyPriorities.join(', ') || 'Not set'}

TASKS:
- Completed (${completedTasks.length}): ${completedTasks.map((t) => `"${t.title}" [${t.category}/${t.priority}]`).join(', ') || 'None'}
- Pending (${pendingTasks.length}): ${pendingTasks.map((t) => `"${t.title}" [${t.priority}]`).join(', ') || 'None'}

FITNESS:
${gymLog ? `- Gym session: ${gymLog.bodyPart}, ${gymLog.duration} min, ${gymLog.caloriesBurned || 0} kcal burned` : '- No gym session today'}

LEARNING:
${learningLogs.length > 0 ? learningLogs.map((l) => `- ${l.topic} (${l.category}): ${l.timeSpent} min`).join('\n') : '- No learning logged'}
Total learning: ${Math.round(totalLearningMinutes / 60 * 10) / 10} hours

HABITS:
- Completed habit logs: ${habitLogs.length}

MOOD: ${moodLog ? `${moodLog.mood}${moodLog.note ? ` — "${moodLog.note}"` : ''}` : 'Not logged'}

FOCUS:
- Completed pomodoro sessions: ${pomodoroSessions.filter((s) => s.completed).length}
- Total focus time: ${Math.round(totalFocusMinutes)} minutes

Return a JSON object with EXACTLY these keys:
{
  "productivityScore": <0-100 number>,
  "disciplineScore": <0-100 number>,
  "timeManagementScore": <0-100 number>,
  "focusScore": <0-100 number>,
  "positiveHabits": [<array of 2-4 specific positive things user did today>],
  "weakAreas": [<array of 2-3 specific areas needing improvement>],
  "suggestions": [<array of 3-5 concrete, actionable suggestions for tomorrow>],
  "motivation": "<1-2 sentence personalised motivational message>",
  "antiProcrastinationTip": "<one specific tip to beat procrastination based on today's data>",
  "fitnessConsistency": "<brief assessment of fitness effort, 1 sentence>",
  "learningGrowth": "<brief assessment of learning effort, 1 sentence>",
  "fullSummary": "<3-4 sentence holistic summary of today's performance>"
}`;

  try {
    const result = await callJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Ensure numeric scores are valid
    const clamp = (v, fallback = 50) =>
      typeof v === 'number' && v >= 0 && v <= 100 ? Math.round(v) : fallback;

    return {
      productivityScore: clamp(result.productivityScore),
      disciplineScore: clamp(result.disciplineScore),
      timeManagementScore: clamp(result.timeManagementScore),
      focusScore: clamp(result.focusScore),
      positiveHabits: Array.isArray(result.positiveHabits)
        ? result.positiveHabits
        : [],
      weakAreas: Array.isArray(result.weakAreas) ? result.weakAreas : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      motivation: result.motivation || '',
      antiProcrastinationTip: result.antiProcrastinationTip || '',
      fitnessConsistency: result.fitnessConsistency || '',
      learningGrowth: result.learningGrowth || '',
      fullSummary: result.fullSummary || '',
    };
  } catch (error) {
    console.error('[OpenAI] generateDailySummary error:', error.message);
    throw new Error(`AI summary generation failed: ${error.message}`);
  }
}

/**
 * generateWeeklyReport(weekData)
 *
 * weekData = {
 *   userName, lifeGoal,
 *   dailyReports[],   // array of DailyReport records for the week
 *   taskStats,        // { total, completed, byCategory }
 *   gymSessions,      // count
 *   learningHours,    // number
 *   habitCompletionRate // 0-1
 * }
 */
export async function generateWeeklyReport(weekData) {
  const {
    userName,
    lifeGoal,
    dailyReports = [],
    taskStats = {},
    gymSessions = 0,
    learningHours = 0,
    habitCompletionRate = 0,
  } = weekData;

  const avgProductivity =
    dailyReports.length > 0
      ? Math.round(
          dailyReports.reduce((a, r) => a + (r.productivityScore || 0), 0) /
            dailyReports.length,
        )
      : 0;

  const systemPrompt = `You are a productivity coach giving a weekly performance review.
Be honest, insightful, and forward-looking. Return ONLY valid JSON.`;

  const userPrompt = `
Weekly performance review for ${userName}:
Life Goal: ${lifeGoal || 'Not set'}

WEEK STATS:
- Days with data: ${dailyReports.length}/7
- Average productivity score: ${avgProductivity}/100
- Tasks: ${taskStats.completed || 0} completed out of ${taskStats.total || 0} total
- Gym sessions: ${gymSessions}/7 days
- Learning hours: ${learningHours}h
- Habit completion rate: ${Math.round(habitCompletionRate * 100)}%

DAILY SCORES:
${dailyReports.map((r, i) => `Day ${i + 1}: Productivity=${r.productivityScore}, Discipline=${r.disciplineScore}, Focus=${r.focusScore}`).join('\n') || 'No daily reports available'}

Return JSON with:
{
  "weeklyProductivityScore": <0-100>,
  "weeklyDisciplineScore": <0-100>,
  "topAchievements": [<3 key achievements this week>],
  "consistencyAreas": [<2-3 areas where user was consistent>],
  "improvementAreas": [<2-3 areas to improve next week>],
  "weeklyInsight": "<2-3 sentence overall insight>",
  "nextWeekGoals": [<3 specific, measurable goals for next week>],
  "motivationalMessage": "<personalised motivational message for the new week>"
}`;

  try {
    return await callJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch (error) {
    console.error('[OpenAI] generateWeeklyReport error:', error.message);
    throw new Error(`Weekly report generation failed: ${error.message}`);
  }
}

/**
 * generateMotivationalQuote(userGoal)
 * Returns { quote, author, reflection }
 */
export async function generateMotivationalQuote(userGoal) {
  const systemPrompt = `You are a wisdom curator. Generate an inspiring motivational quote
tailored to the user's personal goal. Return ONLY valid JSON.`;

  const userPrompt = `Generate a motivational quote for someone whose life goal is: "${userGoal || 'becoming their best self'}"

Return JSON with:
{
  "quote": "<the motivational quote, 1-3 sentences>",
  "author": "<real or [Author Name] if original>",
  "reflection": "<1-2 sentence reflection on why this quote applies to their goal>"
}`;

  try {
    return await callJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch (error) {
    console.error('[OpenAI] generateMotivationalQuote error:', error.message);
    throw new Error(`Quote generation failed: ${error.message}`);
  }
}

/**
 * generateHabitInsights(habitData)
 *
 * habitData = {
 *   userName,
 *   habits[],           // user's habits with frequency and targetCount
 *   completionHistory[] // last 30 days of HabitLog entries
 * }
 */
export async function generateHabitInsights(habitData) {
  const {
    userName,
    habits = [],
    completionHistory = [],
  } = habitData;

  // Compute per-habit completion rates
  const habitStats = habits.map((h) => {
    const logs = completionHistory.filter((l) => l.habitId === h.id);
    return { name: h.name, frequency: h.frequency, logsLast30Days: logs.length };
  });

  const systemPrompt = `You are a habit coach. Analyze the user's habit patterns and give
data-driven insights and actionable advice. Return ONLY valid JSON.`;

  const userPrompt = `
Habit analysis for ${userName} (last 30 days):

${habitStats.length > 0
    ? habitStats
        .map(
          (h) =>
            `- "${h.name}" (${h.frequency}): logged ${h.logsLast30Days} times`,
        )
        .join('\n')
    : 'No habits tracked yet.'}

Return JSON with:
{
  "strongestHabit": "<name of most consistent habit or null>",
  "weakestHabit": "<name of least consistent habit or null>",
  "overallConsistency": <0-100 consistency score>,
  "insights": [<3-4 specific insights about their habit patterns>],
  "recommendations": [<3 concrete recommendations to improve habit streaks>],
  "habitFormationTip": "<one science-backed tip for building stronger habits>"
}`;

  try {
    return await callJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch (error) {
    console.error('[OpenAI] generateHabitInsights error:', error.message);
    throw new Error(`Habit insights generation failed: ${error.message}`);
  }
}

/**
 * generateChatResponse(messages, userContext)
 *
 * messages         = [ { role: 'user'|'assistant', content: string } ]
 * userContext      = { userName, lifeGoal, dailyPriorities, todayStats }
 *
 * Returns { reply: string }
 */
export async function generateChatResponse(messages, userContext = {}) {
  const { userName, lifeGoal, dailyPriorities = [], todayStats = {} } =
    userContext;

  const systemMessage = {
    role: 'system',
    content: `You are an intelligent personal productivity assistant for ${userName || 'the user'}.
You know their life goal: "${lifeGoal || 'not set'}".
Their daily priorities: ${dailyPriorities.join(', ') || 'not set'}.
Today's quick stats: tasks completed=${todayStats.completedTasks || 0}, focus sessions=${todayStats.pomodoroCount || 0}.

Be conversational, warm, and concise. Give practical advice.
Do NOT repeat the user's question back to them.
Keep responses under 150 words unless the user asks for detailed help.`,
  };

  const conversationMessages = [
    systemMessage,
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const reply = await callText(conversationMessages);
    return { reply };
  } catch (error) {
    console.error('[OpenAI] generateChatResponse error:', error.message);
    throw new Error(`Chat response failed: ${error.message}`);
  }
}
