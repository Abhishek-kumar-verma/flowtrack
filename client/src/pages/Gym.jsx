import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Dumbbell, Flame, Clock, TrendingUp, Calendar, AlertCircle, Zap,
} from 'lucide-react';
import { format, subDays, isToday, parseISO } from 'date-fns';
import Layout from '../components/common/Layout.jsx';
import StatCard from '../components/common/StatCard';
import WorkoutCard from '../components/gym/WorkoutCard';
import GymLogModal from '../components/gym/GymLogModal';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { formatDuration } from '../utils/formatters';
import api from '../utils/api.js';

function buildCalendar(workouts) {
  return Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const key = format(d, 'yyyy-MM-dd');
    const hasWorkout = workouts.some((w) => (w.date || '').slice(0, 10) === key);
    return { date: d, key, hasWorkout };
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function Gym() {
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [confirmWorkout, setConfirmWorkout] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/gym');
      setWorkouts(Array.isArray(data) ? data : data.workouts ?? data.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get('/gym/stats');
      setStats(data);
    } catch {
      // non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkouts(); fetchStats(); }, [fetchWorkouts, fetchStats]);

  async function handleSubmit(formData) {
    if (editingWorkout) {
      const id = editingWorkout._id || editingWorkout.id;
      await api.put(`/gym/${id}`, formData);
    } else {
      await api.post('/gym', formData);
    }
    fetchWorkouts();
    fetchStats();
  }

  async function handleDelete() {
    if (!confirmWorkout) return;
    setDeleteLoading(true);
    try {
      const id = confirmWorkout._id || confirmWorkout.id;
      await api.delete(`/gym/${id}`);
      setWorkouts((prev) => prev.filter((w) => w._id !== id && w.id !== id));
      setConfirmWorkout(null);
      fetchStats();
    } finally {
      setDeleteLoading(false);
    }
  }

  function openCreate() { setEditingWorkout(null); setModalOpen(true); }
  function openEdit(w) { setEditingWorkout(w); setModalOpen(true); }

  const calendarDays = buildCalendar(workouts);

  const todayWorkouts = workouts.filter((w) => {
    try {
      const d = w.date ? parseISO(w.date.slice(0, 10)) : null;
      return d && isToday(d);
    } catch { return false; }
  });

  const otherWorkouts = workouts.filter((w) => {
    try {
      const d = w.date ? parseISO(w.date.slice(0, 10)) : null;
      return !(d && isToday(d));
    } catch { return true; }
  });

  const totalDuration = statsLoading
    ? '…'
    : stats?.totalDuration != null
    ? formatDuration(stats.totalDuration)
    : '0m';

  return (
    <Layout title="Gym Tracker">
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Gym Tracker</h1>
            <p className="mt-1 text-sm text-slate-500">Track your workouts and build consistency</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            <Plus size={16} /> Log Workout
          </motion.button>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Dumbbell size={18} />}
            label="This Month"
            value={statsLoading ? '…' : (stats?.monthWorkouts ?? 0)}
            suffix="sessions"
            color="emerald"
          />
          <StatCard
            icon={<Zap size={18} />}
            label="Current Streak"
            value={statsLoading ? '…' : (stats?.currentStreak ?? 0)}
            suffix="days"
            color="amber"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Total Time"
            value={totalDuration}
            color="primary"
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Most Trained"
            value={statsLoading ? '…' : (stats?.mostTrained ?? '—')}
            color="accent"
          />
        </div>

        {/* ── 14-day calendar strip ── */}
        <div className="glass-card px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-300">Last 2 Weeks</h2>
          </div>
          <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
            {calendarDays.map(({ date, key, hasWorkout }) => {
              const today = isToday(date);
              return (
                <div key={key} className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-[10px] text-slate-600 uppercase">
                    {format(date, 'EEE')}
                  </span>
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      hasWorkout
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : today
                        ? 'bg-dark-500 border border-primary-500/50 text-primary-300'
                        : 'bg-dark-700/60 border border-dark-600/50 text-slate-500'
                    }`}
                  >
                    {format(date, 'd')}
                  </div>
                  {hasWorkout && (
                    <div className="h-1 w-1 rounded-full bg-emerald-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* ── Workout list ── */}
        {loading ? (
          <LoadingSkeleton count={3} height="h-24" />
        ) : workouts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dark-500/50 bg-dark-800/40 py-20 px-8 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <Dumbbell size={36} className="text-emerald-400/60" />
            </div>
            <h3 className="text-lg font-semibold text-white">No workouts logged yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              Start tracking your fitness journey by logging your first workout session.
            </p>
            <button
              onClick={openCreate}
              className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={14} /> Log Workout
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {todayWorkouts.length > 0 && (
              <div>
                <h2 className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Today</h2>
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {todayWorkouts.map((w) => (
                      <WorkoutCard
                        key={w._id || w.id}
                        workout={w}
                        onEdit={openEdit}
                        onDelete={(wk) => setConfirmWorkout(wk)}
                        isToday
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {otherWorkouts.length > 0 && (
              <div>
                {todayWorkouts.length > 0 && (
                  <h2 className="mb-2 mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent</h2>
                )}
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {otherWorkouts.map((w) => (
                      <WorkoutCard
                        key={w._id || w.id}
                        workout={w}
                        onEdit={openEdit}
                        onDelete={(wk) => setConfirmWorkout(wk)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Modals ── */}
      <GymLogModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        workout={editingWorkout}
      />
      <ConfirmModal
        isOpen={Boolean(confirmWorkout)}
        onClose={() => setConfirmWorkout(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Workout?"
        message="This workout log will be permanently removed."
        confirmLabel="Delete Workout"
      />
    </Layout>
  );
}
