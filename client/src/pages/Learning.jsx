import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Clock, Brain, BarChart2, Layers, AlertCircle } from 'lucide-react';
import Layout from '../components/common/Layout.jsx';
import StatCard from '../components/common/StatCard';
import LearningCard from '../components/learning/LearningCard';
import LearningModal from '../components/learning/LearningModal';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { formatDuration, getCategoryColor, CATEGORY_LABELS } from '../utils/formatters';
import api from '../utils/api.js';

const ALL_CATEGORIES = ['ALL', ...Object.keys(CATEGORY_LABELS)];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function Learning() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCat, setActiveCat] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [confirmSession, setConfirmSession] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (activeCat !== 'ALL') params.category = activeCat;
      const { data } = await api.get('/learning', { params });
      setSessions(Array.isArray(data) ? data : data.sessions ?? data.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [activeCat]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get('/learning/stats');
      setStats(data);
    } catch {
      // non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  async function handleSubmit(formData) {
    if (editingSession) {
      const id = editingSession._id || editingSession.id;
      await api.put(`/learning/${id}`, formData);
    } else {
      await api.post('/learning', formData);
    }
    fetchSessions();
    fetchStats();
  }

  async function handleDelete() {
    if (!confirmSession) return;
    setDeleteLoading(true);
    try {
      const id = confirmSession._id || confirmSession.id;
      await api.delete(`/learning/${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id && s.id !== id));
      setConfirmSession(null);
      fetchStats();
    } finally {
      setDeleteLoading(false);
    }
  }

  function openCreate() { setEditingSession(null); setModalOpen(true); }
  function openEdit(s) { setEditingSession(s); setModalOpen(true); }

  // Compute stat display values
  const monthHours = statsLoading
    ? '…'
    : stats?.monthMinutes != null
    ? formatDuration(stats.monthMinutes)
    : stats?.monthHours != null
    ? `${stats.monthHours}h`
    : '—';

  const topCat = statsLoading
    ? '…'
    : stats?.topCategory
    ? (CATEGORY_LABELS[stats.topCategory] || stats.topCategory)
    : '—';

  const avgSession = statsLoading
    ? '…'
    : stats?.avgSessionMinutes != null
    ? formatDuration(stats.avgSessionMinutes)
    : '—';

  const weekSessions = statsLoading ? '…' : (stats?.weekSessions ?? 0);

  return (
    <Layout title="Learning Tracker">
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Learning Tracker</h1>
            <p className="mt-1 text-sm text-slate-500">Track what you study and grow every day</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 text-sm shrink-0"
          >
            <Plus size={16} /> Log Session
          </motion.button>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Clock size={18} />} label="This Month" value={monthHours} color="primary" />
          <StatCard icon={<Brain size={18} />} label="Top Category" value={topCat} color="accent" />
          <StatCard icon={<BarChart2 size={18} />} label="Avg Session" value={avgSession} color="cyan" />
          <StatCard icon={<Layers size={18} />} label="This Week" value={weekSessions} suffix="sessions" color="emerald" />
        </div>

        {/* ── Category filter pills ── */}
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = activeCat === cat;
            const catColor = getCategoryColor(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                  isActive
                    ? cat === 'ALL'
                      ? 'bg-white text-dark-900 border-white shadow-sm'
                      : `${catColor} border-current ring-2 ring-offset-1 ring-offset-dark-900 scale-105`
                    : 'border-dark-500/50 bg-dark-700/40 text-slate-400 hover:text-white hover:border-dark-400/60'
                }`}
              >
                {cat === 'ALL' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* ── Session list ── */}
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dark-500/50 bg-dark-800/40 py-20 px-8 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent-500/10">
              <BookOpen size={36} className="text-accent-400/60" />
            </div>
            <h3 className="text-lg font-semibold text-white">No sessions logged</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              {activeCat !== 'ALL'
                ? 'No sessions for this category yet. Try another or log a new session.'
                : 'Start building your learning habit by logging your first session.'}
            </p>
            <button
              onClick={openCreate}
              className="btn-primary mt-5 flex items-center gap-2 text-sm"
            >
              <Plus size={14} /> Log Session
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            <AnimatePresence mode="popLayout">
              {sessions.map((s) => (
                <LearningCard
                  key={s._id || s.id}
                  session={s}
                  onEdit={openEdit}
                  onDelete={(sess) => setConfirmSession(sess)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Modals ── */}
      <LearningModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        session={editingSession}
      />
      <ConfirmModal
        isOpen={Boolean(confirmSession)}
        onClose={() => setConfirmSession(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Session?"
        message={`"${confirmSession?.topic}" will be permanently deleted.`}
        confirmLabel="Delete Session"
      />
    </Layout>
  );
}
