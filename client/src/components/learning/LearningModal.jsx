import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Loader2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { CATEGORY_LABELS } from '../../utils/formatters';

const CATEGORIES = Object.keys(CATEGORY_LABELS);

const DIFFICULTIES = [
  { value: 'EASY',   label: 'Easy',   emoji: '😊' },
  { value: 'MEDIUM', label: 'Medium', emoji: '🤔' },
  { value: 'HARD',   label: 'Hard',   emoji: '😤' },
  { value: 'EXPERT', label: 'Expert', emoji: '🧠' },
];

const BLANK = {
  topic: '',
  category: 'BACKEND',
  notes: '',
  resources: [''],
  hours: '',
  minutes: '',
  difficulty: 'MEDIUM',
  date: format(new Date(), 'yyyy-MM-dd'),
};

/**
 * LearningModal – create or edit a learning session.
 *
 * Props:
 *   isOpen   – boolean
 *   onClose  – () => void
 *   onSubmit – (formData) => Promise<void>
 *   session  – existing session for editing (null → create)
 */
export default function LearningModal({ isOpen, onClose, onSubmit, session }) {
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(session);

  useEffect(() => {
    if (session) {
      const totalMinutes =
        session.timeSpent ?? (session.hours || 0) * 60 + (session.minutes || 0);
      setForm({
        topic: session.topic || '',
        category: session.category || 'BACKEND',
        notes: session.notes || '',
        resources: session.resources?.length ? session.resources : [''],
        hours: String(Math.floor(totalMinutes / 60)),
        minutes: String(totalMinutes % 60),
        difficulty: session.difficulty || 'MEDIUM',
        date: session.date ? session.date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      setForm({ ...BLANK, date: format(new Date(), 'yyyy-MM-dd'), resources: [''] });
    }
    setErrors({});
  }, [session, isOpen]);

  function field(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  }

  function setResource(i, v) {
    setForm((p) => ({ ...p, resources: p.resources.map((r, idx) => (idx === i ? v : r)) }));
  }

  function addResource() {
    setForm((p) => ({ ...p, resources: [...p.resources, ''] }));
  }

  function removeResource(i) {
    setForm((p) => ({ ...p, resources: p.resources.filter((_, idx) => idx !== i) }));
  }

  function validate() {
    const e = {};
    if (!form.topic.trim()) e.topic = 'Topic is required';
    return e;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const hours = Number(form.hours) || 0;
    const minutes = Number(form.minutes) || 0;
    const payload = {
      topic: form.topic.trim(),
      category: form.category,
      notes: form.notes,
      resources: form.resources.filter((r) => r.trim()),
      timeSpent: hours * 60 + minutes,
      hours,
      minutes,
      difficulty: form.difficulty,
      date: form.date,
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrors({ api: err.response?.data?.message || err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="relative z-10 w-full max-w-lg glass-card flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-dark-600/50 px-6 py-4 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/10">
                <BookOpen size={18} className="text-accent-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {isEdit ? 'Edit Session' : 'Log Learning Session'}
              </h2>
              <button
                onClick={onClose}
                className="ml-auto rounded-full p-1.5 text-slate-400 hover:bg-dark-600 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
              {errors.api && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {errors.api}
                </div>
              )}

              {/* Topic */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Topic <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="What did you learn today?"
                  value={form.topic}
                  onChange={(e) => field('topic', e.target.value)}
                  className={`input-field ${errors.topic ? 'border-red-500/60' : ''}`}
                  autoFocus
                />
                {errors.topic && <p className="mt-1 text-xs text-red-400">{errors.topic}</p>}
              </div>

              {/* Category + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => field('category', e.target.value)}
                    className="input-field"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => field('date', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Time spent */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Time Spent
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.hours}
                      onChange={(e) => field('hours', e.target.value)}
                      className="input-field pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">h</span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={form.minutes}
                      onChange={(e) => field('minutes', e.target.value)}
                      className="input-field pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">m</span>
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Difficulty
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => field('difficulty', d.value)}
                      className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                        form.difficulty === d.value
                          ? 'border-primary-500/60 bg-primary-500/10 text-primary-300 shadow-sm shadow-primary-500/10'
                          : 'border-dark-500/50 bg-dark-700/40 text-slate-400 hover:text-white hover:border-dark-400/60'
                      }`}
                    >
                      <span className="block text-lg mb-0.5">{d.emoji}</span>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Key takeaways, insights, summaries…"
                  value={form.notes}
                  onChange={(e) => field('notes', e.target.value)}
                  className="input-field resize-none"
                />
              </div>

              {/* Resources */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resources
                  </label>
                  <button
                    type="button"
                    onClick={addResource}
                    className="flex items-center gap-1 rounded-lg bg-primary-500/10 border border-primary-500/20 px-2.5 py-1 text-xs font-semibold text-primary-400 hover:bg-primary-500/20 transition-colors"
                  >
                    <Plus size={11} /> Add Resource
                  </button>
                </div>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {form.resources.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            placeholder="https://..."
                            value={r}
                            onChange={(e) => setResource(i, e.target.value)}
                            className="flex-1 input-field !py-2 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeResource(i)}
                            disabled={form.resources.length === 1}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1 pb-1">
                <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {isEdit ? 'Save Session' : 'Log Session'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
