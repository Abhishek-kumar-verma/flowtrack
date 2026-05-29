import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  CheckCircle2,
  TrendingUp,
  Flame,
  Clock,
  BookOpen,
  Dumbbell,
  BarChart2,
} from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/common/Layout';
import ActivityHeatmap from '../components/analytics/ActivityHeatmap';
import ProductivityChart from '../components/analytics/ProductivityChart';

const PERIODS = ['week', 'month', 'year'];
const PIE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#14b8a6', '#3b82f6', '#ef4444', '#f97316', '#a3e635',
];

const statCards = [
  { key: 'total_tasks_completed', label: 'Tasks Completed', icon: CheckCircle2, color: 'emerald', suffix: '' },
  { key: 'completion_rate', label: 'Completion Rate', icon: TrendingUp, color: 'indigo', suffix: '%' },
  { key: 'current_streak', label: 'Current Streak', icon: Flame, color: 'orange', suffix: ' days' },
  { key: 'total_focus_hours', label: 'Focus Hours', icon: Clock, color: 'purple', suffix: 'h' },
  { key: 'total_learning_hours', label: 'Learning Hours', icon: BookOpen, color: 'blue', suffix: 'h' },
  { key: 'total_gym_sessions', label: 'Gym Sessions', icon: Dumbbell, color: 'pink', suffix: '' },
];

const colorMap = {
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
  orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
  pink: 'from-pink-500/20 to-pink-600/5 border-pink-500/20 text-pink-400',
};

const iconColorMap = {
  emerald: 'text-emerald-400',
  indigo: 'text-indigo-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  blue: 'text-blue-400',
  pink: 'text-pink-400',
};

function StatCard({ stat, value, loading }) {
  const Icon = stat.icon;
  const classes = colorMap[stat.color];
  const iconClass = iconColorMap[stat.color];

  const displayValue = () => {
    if (loading) return '—';
    if (value === undefined || value === null) return '—';
    if (stat.key === 'completion_rate') return `${Math.round(value)}%`;
    if (stat.key === 'total_focus_hours' || stat.key === 'total_learning_hours')
      return `${(+value).toFixed(1)}h`;
    return value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${classes} border rounded-2xl p-5 relative overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {loading ? (
              <span className="inline-block w-16 h-8 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              displayValue()
            )}
          </p>
        </div>
        <div className={`p-2 rounded-xl bg-white/5 ${iconClass}`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-900 dark:text-white font-semibold">{payload[0].name}</p>
      <p className="text-slate-500 dark:text-gray-400">{payload[0].value} tasks</p>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-500 dark:text-gray-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [period, setPeriod] = useState('week');
  const [overview, setOverview] = useState(null);
  const [productivity, setProductivity] = useState([]);
  const [taskAnalytics, setTaskAnalytics] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState({ overview: true, productivity: true, tasks: true, heatmap: true });
  const [error, setError] = useState({});

  useEffect(() => {
    fetchOverview();
    fetchTaskAnalytics();
    fetchHeatmap();
  }, []);

  useEffect(() => {
    fetchProductivity();
  }, [period]);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/analytics');
      setOverview(res.data);
    } catch (e) {
      setError(prev => ({ ...prev, overview: 'Failed to load overview' }));
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  };

  const fetchProductivity = async () => {
    setLoading(prev => ({ ...prev, productivity: true }));
    try {
      const res = await api.get(`/analytics/productivity?period=${period}`);
      setProductivity(res.data?.data || res.data || []);
    } catch (e) {
      setError(prev => ({ ...prev, productivity: 'Failed to load productivity' }));
    } finally {
      setLoading(prev => ({ ...prev, productivity: false }));
    }
  };

  const fetchTaskAnalytics = async () => {
    try {
      const res = await api.get('/analytics/tasks');
      setTaskAnalytics(res.data);
    } catch (e) {
      setError(prev => ({ ...prev, tasks: 'Failed to load task analytics' }));
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await api.get('/analytics/heatmap');
      setHeatmap(res.data?.data || res.data || []);
    } catch (e) {
      setError(prev => ({ ...prev, heatmap: 'Failed to load heatmap' }));
    } finally {
      setLoading(prev => ({ ...prev, heatmap: false }));
    }
  };

  const categoryData = taskAnalytics?.by_category || taskAnalytics?.categories || [];
  const priorityData = taskAnalytics?.by_priority || taskAnalytics?.priorities || [];
  const learningData = taskAnalytics?.learning_by_category || taskAnalytics?.learning || [];

  return (
    <Layout title="Analytics">
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <BarChart2 size={22} className="text-indigo-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics & Insights</h1>
            </div>
            <p className="text-slate-500 ml-12">Track your performance and progress over time</p>
          </div>

          {/* Period selector */}
          <div className="flex bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-1 gap-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                  period === p
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Row 1: Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <StatCard
                stat={stat}
                value={overview?.[stat.key]}
                loading={loading.overview}
              />
            </motion.div>
          ))}
        </div>

        {/* Row 2: Productivity Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <TrendingUp size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Productivity Trend</h2>
              <p className="text-slate-500 text-sm">Score over the selected period</p>
            </div>
          </div>
          {loading.productivity ? (
            <div className="h-52 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <ProductivityChart data={productivity} period={period} />
          )}
        </motion.div>

        {/* Row 3: Task Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Tasks by Category</h2>
            <p className="text-slate-500 text-sm mb-5">Distribution across categories</p>
            {loading.tasks ? (
              <div className="h-56 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ) : categoryData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
                No category data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="category"
                  >
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-slate-500 dark:text-gray-400 text-xs">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Bar Chart - Priority */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Tasks by Priority</h2>
            <p className="text-slate-500 text-sm mb-5">Completed vs Total</p>
            {loading.tasks ? (
              <div className="h-56 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ) : priorityData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
                No priority data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="priority" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#00000008' }} />
                  <Bar dataKey="total" name="Total" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Row 4: Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Activity Heatmap</h2>
              <p className="text-slate-500 text-sm">Your activity over the past year</p>
            </div>
          </div>
          {loading.heatmap ? (
            <div className="h-32 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <ActivityHeatmap data={heatmap} year={new Date().getFullYear()} />
          )}
        </motion.div>

        {/* Row 5: Learning Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <BookOpen size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Learning Breakdown</h2>
              <p className="text-slate-500 text-sm">Hours by learning category</p>
            </div>
          </div>
          {loading.tasks ? (
            <div className="h-48 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : learningData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No learning data available for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, learningData.length * 52)}>
              <BarChart
                data={learningData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="h"
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: '#00000008' }}
                  formatter={(v) => [`${v}h`, 'Hours']}
                />
                <Bar dataKey="hours" name="Hours" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                  {learningData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
    </Layout>
  );
}
