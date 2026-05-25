import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Flame,
  Check,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Target,
  Loader2,
  RefreshCw,
  AlarmClock,
  ChevronDown,
} from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/common/Layout';
import HabitHeatmap from '../components/common/HabitHeatmap';

const FREQUENCIES = ['Daily', 'Weekly'];

const defaultForm = {
  name: '',
  description: '',
  frequency: 'Daily',
  target_count: 1,
};

function HabitModal({ habit, onClose, onSaved }) {
  const [form, setForm] = useState(habit ? {
    name: habit.name || '',
    description: habit.description || '',
    frequency: habit.frequency || 'Daily',
    target_count: habit.target_count || 1,
  } : { ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (habit?.id) {
        await api.put(`/habits/${habit.id}`, form);
      } else {
        await api.post('/habits', form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save habit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-50 dark:from-emerald-900/40 to-teal-50 dark:to-teal-900/40 border-b border-slate-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-emerald-500 dark:text-emerald-400" />
              <h2 className="text-slate-900 dark:text-white font-semibold">{habit ? 'Edit Habit' : 'New Habit'}</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block">Habit Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Morning Meditation"
                className="w-full bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description..."
                rows={2}
                className="w-full bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block">Frequency</label>
                <div className="relative">
                  <select
                    value={form.frequency}
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block">Daily Target</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.target_count}
                  onChange={e => setForm(f => ({ ...f, target_count: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-gray-600 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {habit ? 'Save Changes' : 'Create Habit'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function HabitCard({ habit, calendarData, onToggle, onEdit, onDelete, toggling }) {
  const isCompleted = habit.completed_today || habit.logged_today || false;
  const streak = habit.streak || habit.current_streak || 0;
  const habitCalData = calendarData?.[habit.id] || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 transition-all duration-300 ${
        isCompleted ? 'border-emerald-500/30' : 'border-slate-200 dark:border-gray-800'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggle(habit)}
          disabled={toggling === habit.id}
          className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
            isCompleted
              ? 'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-500/30'
              : 'border-slate-300 dark:border-gray-700 hover:border-emerald-500 bg-slate-50 dark:bg-gray-800'
          }`}
        >
          {toggling === habit.id ? (
            <Loader2 size={16} className="animate-spin text-slate-400" />
          ) : isCompleted ? (
            <Check size={16} className="text-white" />
          ) : null}
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={`font-semibold text-base ${isCompleted ? 'text-emerald-600 dark:text-emerald-300 line-through decoration-emerald-500/50' : 'text-slate-900 dark:text-white'}`}>
                {habit.name}
              </h3>
              {habit.description && (
                <p className="text-slate-500 text-xs mt-0.5">{habit.description}</p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onEdit(habit)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => onDelete(habit)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-orange-500 dark:text-orange-400 text-xs font-medium bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
              <Flame size={11} />
              {streak} day{streak !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 text-slate-500 text-xs bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-gray-700">
              <AlarmClock size={11} />
              {habit.frequency || 'Daily'}
            </span>
            {habit.target_count > 1 && (
              <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                <Target size={11} />
                Target: {habit.target_count}x
              </span>
            )}
            {isCompleted && (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ✓ Done today
              </span>
            )}
          </div>

          {/* Mini heatmap */}
          {habitCalData.length > 0 && (
            <div className="mt-4">
              <p className="text-slate-400 dark:text-gray-600 text-xs mb-2">Last 30 days</p>
              <HabitHeatmap data={habitCalData} days={30} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHabits();
    fetchCalendar();
  }, []);

  const fetchHabits = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/habits');
      setHabits(res.data?.habits || res.data || []);
    } catch (e) {
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async () => {
    try {
      const res = await api.get('/habits/calendar');
      setCalendarData(res.data || {});
    } catch (e) {
      // Calendar data optional
    }
  };

  const handleToggle = async (habit) => {
    setToggling(habit.id);
    try {
      await api.post(`/habits/${habit.id}/log`, {
        date: new Date().toISOString().split('T')[0],
        completed: !(habit.completed_today || habit.logged_today),
      });
      setHabits(prev => prev.map(h =>
        h.id === habit.id
          ? { ...h, completed_today: !h.completed_today, logged_today: !h.logged_today }
          : h
      ));
    } catch (e) {
      console.error('Toggle failed', e);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (habit) => {
    try {
      await api.delete(`/habits/${habit.id}`);
      setHabits(prev => prev.filter(h => h.id !== habit.id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Delete failed');
    }
  };

  const completedToday = habits.filter(h => h.completed_today || h.logged_today).length;
  const completionRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

  return (
    <Layout title="Habits">
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Flame size={22} className="text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Habit Tracker</h1>
            </div>
            <p className="text-slate-500 ml-12">Build consistency, one day at a time</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setEditingHabit(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-lg hover:shadow-emerald-500/20 transition-all"
          >
            <Plus size={18} />
            New Habit
          </motion.button>
        </motion.div>

        {/* Today's progress bar */}
        {habits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-slate-900 dark:text-white font-semibold">Today's Progress</p>
                <p className="text-slate-500 text-sm">{completedToday} of {habits.length} habits completed</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{completionRate}%</p>
                {completionRate === 100 && (
                  <p className="text-emerald-500 dark:text-emerald-400 text-xs">Perfect day! 🎉</p>
                )}
              </div>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={fetchHabits} className="text-red-400 hover:text-red-500 transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-gray-800 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : habits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Target size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-2">No habits yet</h3>
            <p className="text-slate-500 text-sm mb-5">Start building your daily routine by adding your first habit.</p>
            <button
              onClick={() => { setEditingHabit(null); setShowModal(true); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm"
            >
              <Plus size={16} className="inline mr-1.5" />
              Add First Habit
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Today section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={16} className="text-slate-400" />
                <h2 className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                  Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
              </div>
              <AnimatePresence>
                {habits.map(habit => (
                  <div key={habit.id} className="mb-4">
                    <HabitCard
                      habit={habit}
                      calendarData={calendarData}
                      onToggle={handleToggle}
                      onEdit={(h) => { setEditingHabit(h); setShowModal(true); }}
                      onDelete={(h) => setDeleteConfirm(h)}
                      toggling={toggling}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <HabitModal
          habit={editingHabit}
          onClose={() => { setShowModal(false); setEditingHabit(null); }}
          onSaved={fetchHabits}
        />
      )}

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-2">Delete Habit</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-5">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deleteConfirm.name}"</strong>? All progress data will be lost.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </Layout>
  );
}
