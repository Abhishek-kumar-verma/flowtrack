import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildGeminiParts(messages) {
  const systemMsg = messages.find((m) => m.role === 'system');
  const turns = messages.filter((m) => m.role !== 'system');
  const history = turns.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const lastMessage = turns[turns.length - 1]?.content ?? '';
  return { systemInstruction: systemMsg?.content, history, lastMessage };
}

async function callJSON(messages, model = 'gemini-2.5-flash') {
  const { systemInstruction, history, lastMessage } = buildGeminiParts(messages);
  const geminiModel = genAI.getGenerativeModel({
    model,
    ...(systemInstruction && { systemInstruction }),
    generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 4096 },
  });
  const chat = geminiModel.startChat({ history });
  const result = await chat.sendMessage(lastMessage);
  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('[Gemini] JSON parse failed (truncated?):', e.message, '| text length:', text.length);
    return {};
  }
}

async function callText(messages, model = 'gemini-2.5-flash') {
  const { systemInstruction, history, lastMessage } = buildGeminiParts(messages);
  const geminiModel = genAI.getGenerativeModel({
    model,
    ...(systemInstruction && { systemInstruction }),
    generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
  });
  const chat = geminiModel.startChat({ history });
  const result = await chat.sendMessage(lastMessage);
  return result.response.text().trim();
}

// ─── Public API ───────────────────────────────────────────────────────────────

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

  const systemPrompt = `You are a precise personal productivity coach.
Analyze the user's daily data and return a comprehensive JSON performance report.
Be honest — do not inflate scores if the user did little work.
Give specific, actionable insights tailored to their actual data. Avoid generic advice.
Scores are 0-100 where 100 = exceptional day. A day with zero tasks, no focus, no gym, no learning should score 0-20.
Return ONLY valid JSON with no extra text or markdown fences.`;

  const completedTaskTime = completedTasks.reduce((a, t) => a + (t.timeSpent || 0), 0);

  const userPrompt = `
Analyze this daily progress data for ${userName}:

Life Goal: ${lifeGoal || 'Not set'}
Daily Priorities: ${Array.isArray(dailyPriorities) && dailyPriorities.length ? dailyPriorities.join(', ') : 'Not set'}

TASKS:
- Completed (${completedTasks.length}): ${completedTasks.map((t) => `"${t.title}" [${t.category}/${t.priority}${t.timeSpent ? `/${t.timeSpent}min` : ''}]`).join(', ') || 'None'}
- Pending (${pendingTasks.length}): ${pendingTasks.map((t) => `"${t.title}" [${t.priority}]`).join(', ') || 'None'}
- Total time logged on tasks: ${completedTaskTime} min

FITNESS:
${gymLog ? `- Gym session: ${gymLog.bodyPart || 'general'}, ${gymLog.duration || 0} min, ${gymLog.caloriesBurned || 0} kcal burned` : '- No gym session today'}

LEARNING:
${learningLogs.length > 0 ? learningLogs.map((l) => `- ${l.topic} (${l.category}, difficulty=${l.difficulty}): ${l.timeSpent} min`).join('\n') : '- No learning logged'}
Total learning: ${Math.round(totalLearningMinutes / 60 * 10) / 10} hours

HABITS:
- Completed habit check-ins: ${habitLogs.length}

MOOD: ${moodLog ? `${moodLog.mood}${moodLog.note ? ` — "${moodLog.note}"` : ''}` : 'Not logged'}

FOCUS (Pomodoro):
- Completed sessions: ${pomodoroSessions.filter((s) => s.completed).length}
- Total focus time: ${Math.round(totalFocusMinutes)} minutes

Scoring guide:
- productivityScore: weight task completion rate 50%, gym 15%, learning 15%, pomodoro 20%
- disciplineScore: habits completed, gym consistency, no missing priorities
- timeManagementScore: did they spread focus, finish tasks before deadline?
- focusScore: based purely on pomodoro sessions completed and duration

Return a JSON object with EXACTLY these keys:
{
  "productivityScore": <0-100 number>,
  "disciplineScore": <0-100 number>,
  "timeManagementScore": <0-100 number>,
  "focusScore": <0-100 number>,
  "positiveHabits": [<2-4 specific things the user actually did today>],
  "weakAreas": [<2-3 specific areas with no or low activity today>],
  "suggestions": [<3-5 concrete, data-driven suggestions for tomorrow>],
  "motivation": "<1-2 sentence personalised message referencing their goal>",
  "antiProcrastinationTip": "<one specific, actionable tip based on their pending tasks or patterns>",
  "fitnessConsistency": "<1 sentence assessment of today's fitness activity>",
  "learningGrowth": "<1 sentence assessment of today's learning activity>",
  "fullSummary": "<3-4 sentence holistic summary referencing actual numbers and progress toward life goal>"
}`;

  try {
    const result = await callJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const clamp = (v, fallback = 50) =>
      typeof v === 'number' && v >= 0 && v <= 100 ? Math.round(v) : fallback;

    return {
      productivityScore: clamp(result.productivityScore),
      disciplineScore: clamp(result.disciplineScore),
      timeManagementScore: clamp(result.timeManagementScore),
      focusScore: clamp(result.focusScore),
      positiveHabits: Array.isArray(result.positiveHabits) ? result.positiveHabits : [],
      weakAreas: Array.isArray(result.weakAreas) ? result.weakAreas : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      motivation: result.motivation || '',
      antiProcrastinationTip: result.antiProcrastinationTip || '',
      fitnessConsistency: result.fitnessConsistency || '',
      learningGrowth: result.learningGrowth || '',
      fullSummary: result.fullSummary || '',
    };
  } catch (error) {
    console.error('[Gemini] generateDailySummary error:', error.message);
    throw new Error(`AI summary generation failed: ${error.message}`);
  }
}

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
    console.error('[Gemini] generateWeeklyReport error:', error.message);
    throw new Error(`Weekly report generation failed: ${error.message}`);
  }
}

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
    console.error('[Gemini] generateMotivationalQuote error:', error.message);
    throw new Error(`Quote generation failed: ${error.message}`);
  }
}

export async function generateHabitInsights(habitData) {
  const { userName, habits = [], completionHistory = [] } = habitData;

  const habitStats = habits.map((h) => {
    const logs = completionHistory.filter((l) => l.habitId === h.id);
    return { name: h.name, frequency: h.frequency, logsLast30Days: logs.length };
  });

  const systemPrompt = `You are a habit coach. Analyze the user's habit patterns and give
data-driven insights and actionable advice. Return ONLY valid JSON.`;

  const userPrompt = `
Habit analysis for ${userName} (last 30 days):

${habitStats.length > 0
    ? habitStats.map((h) => `- "${h.name}" (${h.frequency}): logged ${h.logsLast30Days} times`).join('\n')
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
    console.error('[Gemini] generateHabitInsights error:', error.message);
    throw new Error(`Habit insights generation failed: ${error.message}`);
  }
}

export async function generateChatResponse(messages, userContext = {}) {
  const { userName, lifeGoal, dailyPriorities = [], todayStats = {} } = userContext;

  const systemMessage = {
    role: 'system',
    content: `You are a sharp, empathetic personal productivity coach for ${userName || 'the user'}.

Context you have:
- Their life goal: "${lifeGoal || 'not set'}"
- Daily priorities: ${Array.isArray(dailyPriorities) && dailyPriorities.length ? dailyPriorities.join(', ') : 'not set'}
- Today so far: ${todayStats.completedTasks || 0} tasks completed, ${todayStats.pomodoroCount || 0} focus (Pomodoro) sessions

Rules:
- Be direct and specific — no filler phrases like "Great question!" or restating what they said.
- Tie advice to their actual goal and today's stats when relevant.
- Keep replies under 120 words unless they ask for a detailed breakdown.
- Use plain conversational language, no bullet overload for short answers.
- If you don't have enough data to answer precisely, say so briefly and ask a clarifying question.`,
  };

  const conversationMessages = [
    systemMessage,
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const reply = await callText(conversationMessages);
    return { reply };
  } catch (error) {
    console.error('[Gemini] generateChatResponse error:', error.message);
    throw new Error(`Chat response failed: ${error.message}`);
  }
}
