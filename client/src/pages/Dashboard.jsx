import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  CheckSquare,
  Dumbbell,
  BookOpen,
  Flame,
  Quote,
  Plus,
  Sparkles,
  TrendingUp,
  Circle,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext.jsx'
import Layout from '../components/common/Layout.jsx'
import ErrorBoundary from '../components/common/ErrorBoundary.jsx'
import api from '../utils/api.js'

// ── helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ── sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'primary', loading }) {
  const colorMap = {
    primary: 'from-primary-500/20 to-primary-600/10 border-primary-500/20 text-primary-400',
    accent:  'from-accent-500/20 to-accent-600/10 border-accent-500/20 text-accent-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
    amber:   'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400',
  }

  return (
    <motion.div variants={cardVariants} className="stat-card">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} border flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      {loading ? (
        <div className="space-y-2 mt-1">
          <div className="h-6 w-20 bg-slate-200 dark:bg-dark-600 rounded animate-pulse" />
          <div className="h-3 w-14 bg-slate-200 dark:bg-dark-600 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{value ?? '—'}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-600">{sub}</p>}
        </>
      )}
    </motion.div>
  )
}

function TaskRow({ task, onToggle }) {
  return (
    <motion.div
      layout
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-700/50 transition-all group cursor-pointer"
      onClick={() => onToggle(task._id || task.id)}
    >
      <button className="flex-shrink-0">
        {task.status === 'COMPLETED' ? (
          <CheckCircle2 className="w-5 h-5 text-primary-400" />
        ) : (
          <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-primary-400 transition-colors" />
        )}
      </button>
      <span
        className={`flex-1 text-sm ${
          task.status === 'COMPLETED' ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {task.title}
      </span>
      {task.priority && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          task.priority === 'high'
            ? 'bg-rose-500/15 text-rose-400'
            : task.priority === 'medium'
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
        }`}>
          {task.priority}
        </span>
      )}
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3 shadow-card text-sm">
        <p className="text-slate-500 mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="font-semibold" style={{ color: entry.color }}>
            {entry.name}: <span className="text-slate-900 dark:text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ── main component ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()

  const [quote, setQuote] = useState(null)
  const [tasks, setTasks] = useState([])
  const [gym, setGym] = useState(null)
  const [learning, setLearning] = useState(null)
  const [streak, setStreak] = useState(null)
  const [chartData, setChartData] = useState([])
  const [aiReport, setAiReport] = useState(null)

  const [loading, setLoading] = useState({
    quote: true, tasks: true, stats: true, chart: true, ai: true,
  })
  const setLoad = (key, val) => setLoading((prev) => ({ ...prev, [key]: val }))
  const [showTaskModal, setShowTaskModal] = useState(false)
  const QUICK_BLANK = { title: '', description: '', category: '' }
  const [newTask, setNewTask] = useState(QUICK_BLANK)
  const setQuickField = (field, value) =>
    setNewTask((prev) => ({ ...prev, [field]: value }))

  // ── Phase 3: Parallelized API calls with Promise.allSettled ──────────────
  // All 7 requests fire simultaneously → ~40–60% faster than sequential calls.
  // allSettled ensures one failure doesn't block the others.
  const fetchAll = useCallback(async () => {
    setLoading({ quote: true, tasks: true, stats: true, chart: true, ai: true })

    const [quoteRes, tasksRes, gymRes, learningRes, streakRes, chartRes, aiRes] =
      await Promise.allSettled([
        api.get('/quotes/today'),
        api.get('/tasks/today'),
        api.get('/gym/today'),
        api.get('/learning/today'),
        api.get('/analytics/streak'),
        api.get('/analytics/productivity?period=week'),
        api.get('/ai/report'),
      ])

    // Quote
    if (quoteRes.status === 'fulfilled') {
      setQuote(quoteRes.value.data.data)
    } else {
      setQuote({ text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' })
    }
    setLoad('quote', false)

    // Tasks
    if (tasksRes.status === 'fulfilled') {
      const d = tasksRes.value.data
      setTasks(Array.isArray(d) ? d : d.data || d.tasks || [])
    } else {
      setTasks([])
    }
    setLoad('tasks', false)

    // Stats (gym, learning, streak) — all resolved above
    if (gymRes.status === 'fulfilled') {
      setGym(gymRes.value.data)
    } else {
      setGym(null)
    }
    if (learningRes.status === 'fulfilled') {
      setLearning(learningRes.value.data)
    } else {
      setLearning(null)
    }
    if (streakRes.status === 'fulfilled') {
      const d = streakRes.value.data
      setStreak(d?.streak ?? d?.current ?? 0)
    } else {
      setStreak(0)
    }
    setLoad('stats', false)

    // Chart
    if (chartRes.status === 'fulfilled') {
      const d = chartRes.value.data
      setChartData(Array.isArray(d) ? d : d.data || [])
    } else {
      // Opt-4: show empty chart on failure instead of random data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      setChartData(days.map((day) => ({ day, tasks: 0, learning: 0 })))
    }
    setLoad('chart', false)

    // AI report
    if (aiRes.status === 'fulfilled') {
      setAiReport(aiRes.value.data)
    } else {
      setAiReport(null)
    }
    setLoad('ai', false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleTask = async (taskId) => {
    // Find current status first
    const current = tasks.find((t) => t._id === taskId || t.id === taskId)
    if (!current) return

    const newStatus = current.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        (t._id === taskId || t.id === taskId) ? { ...t, status: newStatus } : t
      )
    )

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus })
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          (t._id === taskId || t.id === taskId) ? { ...t, status: current.status } : t
        )
      )
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    const payload = {
      title: newTask.title.trim(),
      status: 'TODO',
      ...(newTask.description.trim() && { description: newTask.description.trim() }),
      ...(newTask.category && { category: newTask.category }),
    }
    try {
      const { data } = await api.post('/tasks', payload)
      setTasks((prev) => [...prev, data.data || data.task || data])
    } catch {
      setTasks((prev) => [
        ...prev,
        { id: Date.now(), title: newTask.title.trim(), status: 'TODO' },
      ])
    } finally {
      setNewTask(QUICK_BLANK)
      setShowTaskModal(false)
    }
  }

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length
  const totalCount = tasks.length

  const gymDisplay = gym
    ? gym.completed
      ? '✓ Done'
      : gym.name || 'Logged'
    : '✗ None'

  const learningMins = learning?.duration || 0
  const learningDisplay = learningMins
    ? `${Math.floor(learningMins / 60)}h ${learningMins % 60}m`
    : '0m'

  return (
    <Layout title="Dashboard">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Greeting + refresh */}
          <motion.div variants={cardVariants} className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {getGreeting()},{' '}
                <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>! 🌟
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={fetchAll}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </motion.div>

          {/* Quote card */}
          <motion.div variants={cardVariants} className="glass-card p-5 border-l-4 border-primary-500">
            <div className="flex gap-3">
              <Quote className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
              {loading.quote ? (
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-dark-600 rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-slate-200 dark:bg-dark-600 rounded animate-pulse w-1/3" />
                </div>
              ) : (
                <div>
                  <p className="text-slate-700 dark:text-slate-200 text-sm italic leading-relaxed">
                    "{quote?.content  || 'Stay positive, work hard, make it happen.'}"
                  </p>
                  {quote?.author && (
                    <p className="text-slate-500 text-xs mt-1.5">— {quote.author}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={cardVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={CheckSquare}
              label="Today's Tasks"
              value={`${completedCount}/${totalCount}`}
              sub="completed"
              color="primary"
              loading={loading.tasks}
            />
            <StatCard
              icon={Dumbbell}
              label="Gym Today"
              value={gymDisplay}
              color="emerald"
              loading={loading.stats}
            />
            <StatCard
              icon={BookOpen}
              label="Learning"
              value={learningDisplay}
              sub="today"
              color="accent"
              loading={loading.stats}
            />
            <StatCard
              icon={Flame}
              label="Current Streak"
              value={streak !== null ? `${streak} days` : '—'}
              color="amber"
              loading={loading.stats}
            />
          </motion.div>
        </motion.div>

        {/* Main grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          {/* Tasks */}
          <motion.div variants={cardVariants} className="xl:col-span-2 glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary-400" />
                Today's Tasks
              </h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/30 text-primary-300 text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </div>

            {loading.tasks ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-11 bg-slate-100 dark:bg-dark-700/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-dark-700/60 flex items-center justify-center mx-auto">
                  <CheckSquare className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm">No tasks yet. Add your first task!</p>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            ) : (
              <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <TaskRow key={task._id || task.id} task={task} onToggle={toggleTask} />
                ))}
              </div>
            )}

            {tasks.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{completedCount} of {totalCount} completed</span>
                  <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Workout summary */}
            <motion.div variants={cardVariants} className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                Workout Today
              </h3>
              {loading.stats ? (
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-dark-600 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-dark-600 rounded animate-pulse w-1/2" />
                </div>
              ) : gym ? (
                <div className="space-y-1.5">
                  <p className="text-slate-900 dark:text-white font-medium text-sm">{gym.name || gym.type || 'Workout logged'}</p>
                  {gym.duration && (
                    <p className="text-slate-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {gym.duration} minutes
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No workout logged today.</p>
              )}
            </motion.div>

            {/* Learning summary */}
            <motion.div variants={cardVariants} className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent-400" />
                Learning Today
              </h3>
              {loading.stats ? (
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-dark-600 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-dark-600 rounded animate-pulse w-1/2" />
                </div>
              ) : learning ? (
                <div className="space-y-1.5">
                  <p className="text-slate-900 dark:text-white font-medium text-sm">{learning.topic || 'Learning session'}</p>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {learningDisplay}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No learning logged today.</p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Weekly chart + AI Summary */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          {/* Chart */}
          <motion.div variants={cardVariants} className="xl:col-span-2 glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                Weekly Productivity
              </h2>
              <span className="text-xs text-slate-500">Last 7 days</span>
            </div>

            {loading.chart ? (
              <div className="h-48 bg-slate-100 dark:bg-dark-700/40 rounded-xl animate-pulse" />
            ) : (
              <ErrorBoundary fallback={<p className="text-slate-500 text-sm py-8 text-center">Chart unavailable</p>}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-dark-600" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                    <Bar dataKey="tasks" name="Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="learning" name="Learning hrs" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            )}
          </motion.div>

          {/* AI Summary */}
          <motion.div variants={cardVariants} className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-400" />
              AI Summary
            </h2>

            {loading.ai ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-3 bg-slate-200 dark:bg-dark-600 rounded animate-pulse" style={{ width: `${90 - i * 10}%` }} />
                ))}
              </div>
            ) : aiReport ? (
              <div className="space-y-4">
                {aiReport.summary && (
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{aiReport.summary}</p>
                )}
                {aiReport.suggestions?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suggestions</p>
                    {aiReport.suggestions.slice(0, 3).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-1.5 flex-shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}
                {aiReport.date && (
                  <p className="text-xs text-slate-400 dark:text-slate-600">
                    Generated {new Date(aiReport.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-accent-400" />
                </div>
                <p className="text-slate-500 text-sm">No AI summary available yet.</p>
                <p className="text-slate-400 dark:text-slate-600 text-xs">Track more activities to get personalized insights.</p>
              </div>
            )}

            <button className="btn-ghost w-full flex items-center justify-center gap-2 text-sm mt-2">
              View Full Report
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Quick Add Task Modal */}
      {showTaskModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTaskModal(false) }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card p-6 w-full max-w-md space-y-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-400" />
              Add New Task
            </h3>
            <form onSubmit={addTask} className="space-y-4">
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setQuickField('title', e.target.value)}
                placeholder="What do you need to do?"
                className="input-field"
                autoFocus
              />
              <textarea
                rows={2}
                value={newTask.description}
                onChange={(e) => setQuickField('description', e.target.value)}
                placeholder="Description (optional)"
                className="input-field resize-none"
              />
              <select
                value={newTask.category}
                onChange={(e) => setQuickField('category', e.target.value)}
                className="input-field"
              >
                <option value="">No Category</option>
                <option value="WORK">Work</option>
                <option value="PERSONAL">Personal</option>
                <option value="LEARNING">Learning</option>
                <option value="HEALTH">Health</option>
                <option value="DEEP_WORK">Deep Work</option>
                <option value="SIDE_PROJECT">Side Project</option>
              </select>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={!newTask.title.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </Layout>
  )
}
