# Backend Optimization & Bug Fix Plan

> **Constraint:** API types and response shapes must NOT change.  
> **Run status:** Syntax passes (`node --check`). Server won't start cleanly without a DB, but logic-level bugs were found by reading every source file.

---

## CRITICAL BUGS (app crashes at runtime on every API call)

### BUG-1 · All controllers: repository named exports never imported

Every controller imports the repository module as a **default** import but then calls **named** exports that were never brought into scope. This causes `ReferenceError: <fn> is not defined` on every API hit.

| Controller | Default import (unused) | Named functions called but not imported |
|---|---|---|
| `authController.js` | `userRepository` | `createUser`, `findUserByUsername`, `updateUser` |
| `taskController.js` | `taskRepository` | `findTasks`, `findTaskById`, `createTask`, `updateTask`, `deleteTask`, `incrementTaskTime`, `findTodaysTasks` |
| `gymController.js` | `gymRepository` | `findGymLogs`, `findGymLogById`, `createGymLog`, `updateGymLog`, `deleteGymLog`, `findGymLogsByDateRange`, `findAllGymBodyParts`, `findAllGymLogDates`, `findTodaysGymLog` |
| `habitController.js` | `habitRepository` | `findHabitsWithTodayLogs`, `createHabit`, `findHabitById`, `updateHabit`, `deleteHabit`, `findHabitLogToday`, `createHabitLog`, `findHabitLogs`, `findHabitsWithLogs` |
| `learningController.js` | `learningRepository` | `findLearningLogs`, `findLearningLogById`, `createLearningLog`, `updateLearningLog`, `deleteLearningLog`, `findLearningLogsByDateRange` |
| `moodController.js` | `moodRepository` | `findMoodLogByDate`, `createMoodLog`, `findMoodLogsByRange` |
| `pomodoroController.js` | `pomodoroRepository` | `createSession`, `findSessionById`, `updateSession` |
| `userController.js` | `userRepository` | `findUserById`, `updateUser` |
| `aiController.js` | `dailyReportRepository` | `upsertReport`, `findReportByUserAndDate` |
| `quotesController.js` | `quoteRepository` | `findQuoteByDate`, `createQuote` |

**Fix:** Replace each `import fooRepository from '...'` with named imports, e.g.:
```js
import { createUser, findUserByUsername, updateUser } from '../repositories/userRepository.js';
```

---

### BUG-2 · Naming conflicts in controllers → infinite recursion / stack overflow

In several controllers, the handler function and the repository function it calls share the **same name**. After BUG-1 is fixed (named imports added), calling the repo function will instead recursively call the handler itself.

| File | Conflicting names |
|---|---|
| `taskController.js` | `createTask`, `updateTask`, `deleteTask` |
| `gymController.js` | `createGymLog`, `updateGymLog`, `deleteGymLog` |
| `habitController.js` | `createHabit`, `updateHabit`, `deleteHabit` |
| `learningController.js` | `createLearningLog`, `updateLearningLog`, `deleteLearningLog` |

**Fix:** Import the repository function under an alias, e.g.:
```js
import {
  createTask as createTaskInDB,
  updateTask as updateTaskInDB,
  deleteTask as deleteTaskInDB,
  ...
} from '../repositories/taskRepository.js';
```
Then call `createTaskInDB(...)` inside the `createTask` handler.

---

### BUG-3 · `GymExercise` association missing `as: 'exercises'` alias → EagerLoadingError

`models/index.js` defines:
```js
GymLog.hasMany(GymExercise, { foreignKey: 'gymLogId', onDelete: 'CASCADE' });
// ↑ no alias defined
```
But `gymRepository.js`, `aiController.js`, `userController.js`, and `cronJobs.js` all include:
```js
include: [{ model: GymExercise, as: 'exercises' }]
```
Sequelize throws `EagerLoadingError: Association with alias "exercises" does not exist on GymLog`.

**Fix:** Add the alias in `models/index.js`:
```js
GymLog.hasMany(GymExercise, { foreignKey: 'gymLogId', as: 'exercises', onDelete: 'CASCADE' });
GymExercise.belongsTo(GymLog, { foreignKey: 'gymLogId', as: 'gymLog' });
```

---

### BUG-4 · `generateWeeklyReports` cron: AI result never saved to database

In `cronJobs.js`, `generateWeeklyReports()` calls `generateWeeklyReport(...)` and gets a result, but the result is **never persisted**. The weekly AI report is silently discarded.

```js
// current (broken)
const report = await generateWeeklyReport({ ... });
console.log(`score=${report.weeklyProductivityScore}`);
// ← nothing saved
```

**Fix:** After generating the report, upsert it into `DailyReport` or a dedicated weekly report store. Needs clarification on where to store (see Questions below).

---

### BUG-5 · `cleanStalePomodoroSessions`: stale sessions not marked `completed`

```js
await PomodoroSession.update(
  { endedAt: new Date() },         // BUG: missing completed: true
  { where: { completed: false, startedAt: { [Op.lt]: cutoff } } },
);
```
Sessions get an `endedAt` timestamp but `completed` stays `false`. All stat queries that filter `completed: true` continue to ignore these sessions → incorrect focus time totals.

**Fix:**
```js
await PomodoroSession.update(
  { endedAt: new Date(), completed: true },
  { where: { completed: false, startedAt: { [Op.lt]: cutoff } } },
);
```

---

## HIGH BUGS (crash in specific cases)

### BUG-6 · `updateProfile` crashes when user not found

`userRepository.updateUser` returns `rows[0]` which is `undefined` if no user matched. Then `userController.updateProfile` calls `.toJSON()` on it → `TypeError: Cannot read properties of undefined`.

**Fix:** Add a null-check in `updateProfile` and return 404 if the updated instance is missing.

---

### BUG-7 · Invalid date strings silently create `Invalid Date`

`new Date("garbage")` = `Invalid Date`. Sequelize then throws a cryptic 500 internal error instead of a clean 400. Affects all endpoints that accept a `date`, `deadline`, or `startDate`/`endDate` query param: `createTask`, `updateTask`, `createGymLog`, `updateGymLog`, `createLearningLog`, `updateLearningLog`, `getMoodLogs`, `getGymLogs`, `getLearningLogs`, `getDailyReport`.

**Fix:** Add a small date-validation helper and call it before `new Date(...)` in each affected controller.

---

## MEDIUM BUGS (incorrect behavior, no crash)

### BUG-8 · `todayRange()` uses local server time instead of UTC

`taskController`, `gymController`, `habitController`, and `pomodoroController` define:
```js
const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);   // ← LOCAL time
  ...
};
```
`userController` and `analyticsController` correctly use `setUTCHours`. When the server timezone ≠ UTC, "today" spans different clock ranges across modules → subtle date boundary bugs (e.g., tasks created at 23:30 local time may appear in the wrong day).

**Fix:** Standardize all `todayRange()` and date helpers to use `setUTCHours(0,0,0,0)`.

---

### BUG-9 · `quotesController.js` - unused dead-code aliases

```js
const getQuotes = getAllQuotes;   // duplicate alias, not exported
const createQuote = addQuote;     // shadows repo import, not exported
```
These are noise and `createQuote` shadows the named repo import once BUG-1 is fixed.

**Fix:** Remove both lines.

---

### BUG-10 · `sendAuthResponse` in `authController.js` - pointless object spread

```js
const { ...safeUser } = user;
return res.status(statusCode).json({ success: true, token, user: safeUser });
```
`{ ...safeUser }` is identical to `user`. The spread does nothing (no fields are destructured away). This is a passwordless app so there's nothing to strip, but the code implies a security intent that isn't fulfilled.

**Fix:** Replace `const { ...safeUser } = user;` with nothing; just pass `user` directly.

---

## CRON / SCHEDULER ISSUES

### BUG-11 · AI daily (23:30 IST) runs BEFORE non-AI daily (23:45 IST)

The intended design seems to be: non-AI generates a basic report first, then AI enhances it. But the schedule is reversed:
- 23:30 IST → AI daily reports (upserts full AI report)
- 23:45 IST → non-AI daily reports (skips users that already have a report)

If AI succeeds → non-AI is a complete no-op (intended as a fallback but never runs).  
If AI fails → non-AI correctly generates a fallback report.

**Fix (after timezone migration):** Swap cron times: non-AI at 23:30 IST, AI at 23:45 IST. Non-AI generates the base report first; AI enhances it 15 min later and upserts. If AI fails, base report stands.

---

## DECISIONS & ANSWERS (from user)

### Q1 → Report Architecture

**Decision:** Reports should support `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`, and `CUSTOM` (manually selected time span). Auto-generated except `CUSTOM`.

**Plan:** Replace the current `DailyReport` model with a unified `Report` model:

```
Report {
  id          INTEGER PK
  userId      INTEGER FK → User
  type        ENUM('DAILY','WEEKLY','MONTHLY','YEARLY','CUSTOM')
  startDate   DATE           ← period start
  endDate     DATE           ← period end (= startDate for DAILY)
  isAI        BOOLEAN        ← true if AI-generated
  isManual    BOOLEAN        ← true if user-triggered (CUSTOM)
  // all existing score/text fields carry over unchanged
  productivityScore, disciplineScore, timeManagementScore, focusScore
  positiveHabits[], weakAreas[], suggestions[]
  motivation, antiprocrastinationTip, fitnessConsistency, learningGrowth, aiSummary
  completedTasks, pendingTasks
  createdAt, updatedAt
}
```

- `DAILY` reports: `startDate = endDate = that day` — same as current `DailyReport.date`
- `WEEKLY` reports: `startDate = Monday`, `endDate = Sunday` of that week
- `MONTHLY` reports: `startDate = 1st`, `endDate = last day` of that month
- `YEARLY`: `startDate = Jan 1`, `endDate = Dec 31`
- `CUSTOM`: user sends `?startDate=&endDate=` to the manual-generate endpoint

**Migration strategy:** Keep existing `DailyReport` table. Add `Report` as a new table. Migrate cron jobs to write to `Report`. Old API routes continue reading from `DailyReport` for now (no API response change). New report routes read from `Report`.

> ⚠️ Needs a new migration file + model + repository + routes. This is the largest task in the plan.

---

### Q2 → ID Type

**Decision:** All IDs are **integers**. `parseInt(req.params.id, 10)` is correct everywhere. No changes needed.

---

### Q3 → Timezone

**Decision:** All date logic should use **Indian Standard Time (IST = UTC+5:30)**, not UTC and not local time.

**Plan:** 
1. Add `process.env.TZ = 'Asia/Kolkata'` as the very first line of `src/app.js` (before any imports). This makes `new Date()`, `setHours()`, and `toLocaleDateString()` all use IST automatically — no library needed.
2. Replace all `setUTCHours` calls in `userController.js` and `analyticsController.js` with `setHours` (since TZ is now IST).
3. The `todayRange()` helpers already use `setHours` (local time) — once TZ is set to IST, these become correct automatically.
4. Update cron job schedules: convert all UTC times to their IST equivalent.

**IST cron conversions (UTC → IST = UTC+5:30):**
| Job | Current (UTC) | IST equivalent | New UTC (to keep same IST time) |
|---|---|---|---|
| seedDailyQuote | 00:01 UTC | 05:31 IST | keep at 00:01 UTC (runs at 05:31 IST) ✓ |
| generateDailyReports | 23:45 UTC | 05:15 IST next day | change to 18:15 UTC to run at 23:45 IST |
| cleanStalePomodoroSessions | 01:00 UTC | 06:30 IST | keep or adjust |
| generateAIDailyReports | 23:30 UTC | 05:00 IST next day | change to 18:00 UTC to run at 23:30 IST |
| generateWeeklyReports | 20:00 UTC Sunday | 01:30 IST Monday | change to 20:00 UTC Sunday → stays reasonable |

---

### Q4 → Stale Pomodoro Threshold

**Decision: 25 minutes** — matches the exact duration of one Pomodoro. If a session hasn't been ended by the time the timer would have naturally finished, it's abandoned. Threshold can be raised later as users build the habit.

Change `cutoff` in `cleanStalePomodoroSessions` from `Date.now() - 86_400_000` (24h) to `Date.now() - 25 * 60 * 1000` (25 min).

---

## FINAL TASK CHECKLIST

| # | File(s) | Task | Priority | Status |
|---|---|---|---|---|
| 1 | `src/app.js` | Add `process.env.TZ = 'Asia/Kolkata'` as first line | CRITICAL | pending |
| 2 | `src/controllers/authController.js` | Named imports + remove useless spread | CRITICAL | pending |
| 3 | `src/controllers/taskController.js` | Named imports + alias conflicting names | CRITICAL | pending |
| 4 | `src/controllers/gymController.js` | Named imports + alias conflicting names | CRITICAL | pending |
| 5 | `src/controllers/habitController.js` | Named imports + alias conflicting names | CRITICAL | pending |
| 6 | `src/controllers/learningController.js` | Named imports + alias conflicting names | CRITICAL | pending |
| 7 | `src/controllers/moodController.js` | Named imports | CRITICAL | pending |
| 8 | `src/controllers/pomodoroController.js` | Named imports | CRITICAL | pending |
| 9 | `src/controllers/userController.js` | Named imports + null-check after updateUser + `setHours` (IST) | CRITICAL | pending |
| 10 | `src/controllers/aiController.js` | Named imports for dailyReportRepository | CRITICAL | pending |
| 11 | `src/controllers/quotesController.js` | Named imports + remove dead aliases | CRITICAL | pending |
| 12 | `src/controllers/analyticsController.js` | Change `setUTCHours` → `setHours` (IST via TZ) | CRITICAL | pending |
| 13 | `src/models/index.js` | Add `as: 'exercises'` to GymExercise association | CRITICAL | pending |
| 14 | `src/jobs/cronJobs.js` | Mark stale Pomodoro sessions `completed: true` + change threshold from 24h → 25min | CRITICAL | pending |
| 15 | `src/jobs/cronJobs.js` | Fix cron UTC times → correct IST-equivalent UTC times | CRITICAL | pending |
| 16 | `src/jobs/cronJobs.js` | Fix cron fallback order: non-AI before AI | HIGH | pending |
| 17 | `src/controllers/taskController.js` | Add date validation for `deadline` | HIGH | pending |
| 18 | `src/controllers/gymController.js` | Add date validation for `date`, `startDate`, `endDate` | HIGH | pending |
| 19 | `src/controllers/learningController.js` | Add date validation for `date`, `startDate`, `endDate` | HIGH | pending |
| 20 | `src/controllers/quotesController.js` | Remove `getQuotes` and `createQuote` dead aliases | MEDIUM | pending |
| 21 | New migration + model | Add `Report` model (DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM) | LARGE | **awaiting Q4 answer + confirmation** |
| 22 | `src/jobs/cronJobs.js` | Save weekly AI result to new `Report` table | CRITICAL (after #21) | **awaiting Q4 answer** |

> **All questions answered. Say "go" to begin execution.**
