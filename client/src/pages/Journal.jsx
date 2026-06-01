import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookText, BookOpen, BarChart2, CalendarDays, AlertCircle } from 'lucide-react';
import Layout from '../components/common/Layout.jsx';
import StatCard from '../components/common/StatCard';
import JournalCard from '../components/journal/JournalCard';
import JournalModal from '../components/journal/JournalModal';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import api from '../utils/api.js';

const MOOD_FILTERS = [
  { value: 'ALL',      label: 'All' },
  { value: 'GREAT',    label: '😄 Great' },
  { value: 'GOOD',     label: '🙂 Good' },
  { value: 'NEUTRAL',  label: '😐 Neutral' },
  { value: 'BAD',      label: '😔 Bad' },
  { value: 'TERRIBLE', label: '😢 Terrible' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moodFilter, setMoodFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (moodFilter !== 'ALL') params.mood = moodFilter;
      const { data } = await api.get('/journal', { params });
      setEntries(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [moodFilter]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get('/journal/stats');
      setStats(data.data ?? data);
    } catch {
      // non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  async function handleSubmit(formData) {
    if (editingEntry) {
      const id = editingEntry.id;
      await api.put(`/journal/${id}`, formData);
    } else {
      await api.post('/journal', formData);
    }
    fetchEntries();
    fetchStats();
  }

  async function handleDelete() {
    if (!confirmEntry) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/journal/${confirmEntry.id}`);
      setEntries((prev) => prev.filter((e) => e.id !== confirmEntry.id));
      setConfirmEntry(null);
      fetchStats();
    } finally {
      setDeleteLoading(false);
    }
  }

  function openCreate() { setEditingEntry(null); setModalOpen(true); }
  function openEdit(e) { setEditingEntry(e); setModalOpen(true); }

  const totalEntries = statsLoading ? '…' : (stats?.total ?? 0);
  const monthEntries = statsLoading ? '…' : (stats?.monthCount ?? 0);
  const weekEntries  = statsLoading ? '…' : (stats?.weekCount ?? 0);

  return (
    <Layout title="Journal">
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Journal</h1>
            <p className="mt-1 text-sm text-slate-500">Reflect daily — write, grow, remember</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 text-sm shrink-0"
          >
            <Plus size={16} /> New Entry
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<BookText size={18} />}      label="Total Entries"  value={totalEntries}  color="primary" />
          <StatCard icon={<CalendarDays size={18} />}  label="This Month"     value={monthEntries}  color="accent" />
          <StatCard icon={<BarChart2 size={18} />}     label="This Week"      value={weekEntries}   color="cyan" />
        </div>

        {/* Mood filter pills */}
        <div className="flex flex-wrap gap-2">
          {MOOD_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setMoodFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                moodFilter === f.value
                  ? 'bg-white text-dark-900 border-white shadow-sm'
                  : 'border-dark-500/50 bg-dark-700/40 text-slate-400 hover:text-white hover:border-dark-400/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Entry list */}
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dark-500/50 bg-dark-800/40 py-20 px-8 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500/10">
              <BookOpen size={36} className="text-primary-400/60" />
            </div>
            <h3 className="text-lg font-semibold text-white">No entries yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              {moodFilter !== 'ALL'
                ? 'No entries match this mood filter. Try another or write a new entry.'
                : 'Start your journaling habit. Write your first reflection today.'}
            </p>
            <button onClick={openCreate} className="btn-primary mt-5 flex items-center gap-2 text-sm">
              <Plus size={14} /> New Entry
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
              {entries.map((e) => (
                <JournalCard
                  key={e.id}
                  entry={e}
                  onEdit={openEdit}
                  onDelete={(entry) => setConfirmEntry(entry)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <JournalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        entry={editingEntry}
      />
      <ConfirmModal
        isOpen={Boolean(confirmEntry)}
        onClose={() => setConfirmEntry(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Entry?"
        message={`"${confirmEntry?.title}" will be permanently deleted.`}
        confirmLabel="Delete Entry"
      />
    </Layout>
  );
}
