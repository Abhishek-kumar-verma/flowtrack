import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, BookText, Plus, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const MOODS = [
  { value: 'GREAT',    label: 'Great',    emoji: '😄' },
  { value: 'GOOD',     label: 'Good',     emoji: '🙂' },
  { value: 'NEUTRAL',  label: 'Neutral',  emoji: '😐' },
  { value: 'BAD',      label: 'Bad',      emoji: '😔' },
  { value: 'TERRIBLE', label: 'Terrible', emoji: '😢' },
];

const BLANK = {
  title: '',
  content: '',
  mood: '',
  tags: [],
  tagInput: '',
  date: format(new Date(), 'yyyy-MM-dd'),
};

export default function JournalModal({ isOpen, onClose, onSubmit, entry }) {
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(entry);

  useEffect(() => {
    if (entry) {
      setForm({
        title: entry.title || '',
        content: entry.content || '',
        mood: entry.mood || '',
        tags: Array.isArray(entry.tags) ? [...entry.tags] : [],
        tagInput: '',
        date: entry.date ? entry.date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      setForm({ ...BLANK, date: format(new Date(), 'yyyy-MM-dd'), tags: [] });
    }
    setErrors({});
  }, [entry, isOpen]);

  function field(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  }

  function addTag() {
    const tag = form.tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    setForm((p) => ({ ...p, tags: [...p.tags, tag], tagInput: '' }));
  }

  function removeTag(tag) {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.content.trim()) e.content = 'Content is required';
    return e;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      mood: form.mood || null,
      tags: form.tags,
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10">
                <BookText size={18} className="text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {isEdit ? 'Edit Entry' : 'New Journal Entry'}
              </h2>
              <button
                onClick={onClose}
                className="ml-auto rounded-full p-1.5 text-slate-400 hover:bg-dark-600 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
              {errors.api && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {errors.api}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Give this entry a title…"
                  value={form.title}
                  onChange={(e) => field('title', e.target.value)}
                  className={`input-field ${errors.title ? 'border-red-500/60' : ''}`}
                  autoFocus
                />
                {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
              </div>

              {/* Date */}
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

              {/* Mood */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mood (optional)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => field('mood', form.mood === m.value ? '' : m.value)}
                      className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                        form.mood === m.value
                          ? 'border-primary-500/60 bg-primary-500/10 text-primary-300 shadow-sm shadow-primary-500/10'
                          : 'border-dark-500/50 bg-dark-700/40 text-slate-400 hover:text-white hover:border-dark-400/60'
                      }`}
                    >
                      <span className="block text-xl mb-0.5">{m.emoji}</span>
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={7}
                  placeholder="What's on your mind today? Reflect on your progress, thoughts, or feelings…"
                  value={form.content}
                  onChange={(e) => field('content', e.target.value)}
                  className={`input-field resize-none ${errors.content ? 'border-red-500/60' : ''}`}
                />
                {errors.content && <p className="mt-1 text-xs text-red-400">{errors.content}</p>}
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tags (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a tag and press Enter"
                    value={form.tagInput}
                    onChange={(e) => field('tagInput', e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-xl border border-primary-500/30 bg-primary-500/10 px-3 text-primary-400 hover:bg-primary-500/20 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {form.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-full bg-primary-500/10 border border-primary-500/20 px-2.5 py-0.5 text-xs font-medium text-primary-400"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                          <XCircle size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                  {isEdit ? 'Save Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
