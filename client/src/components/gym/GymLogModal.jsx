import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Loader2, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';

const BODY_PARTS = [
  { value: 'CHEST', label: 'Chest' },
  { value: 'BACK', label: 'Back' },
  { value: 'LEGS', label: 'Legs' },
  { value: 'SHOULDERS', label: 'Shoulders' },
  { value: 'ARMS', label: 'Arms' },
  { value: 'CORE', label: 'Core' },
  { value: 'FULL_BODY', label: 'Full Body' },
  { value: 'CARDIO', label: 'Cardio' },
];

const BODY_PART_ACTIVE = {
  CHEST: 'bg-red-500/20 text-red-300 ring-red-500/40',
  BACK: 'bg-blue-500/20 text-blue-300 ring-blue-500/40',
  LEGS: 'bg-green-500/20 text-green-300 ring-green-500/40',
  SHOULDERS: 'bg-orange-500/20 text-orange-300 ring-orange-500/40',
  ARMS: 'bg-purple-500/20 text-purple-300 ring-purple-500/40',
  CORE: 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/40',
  FULL_BODY: 'bg-pink-500/20 text-pink-300 ring-pink-500/40',
  CARDIO: 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/40',
};

const BLANK_EX = { name: '', sets: '', reps: '', weight: '' };

const BLANK = {
  bodyPart: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  duration: '',
  caloriesBurned: '',
  notes: '',
  exercises: [{ ...BLANK_EX }],
};

/**
 * GymLogModal – log or edit a gym workout session.
 *
 * Props:
 *   isOpen   – boolean
 *   onClose  – () => void
 *   onSubmit – (formData) => Promise<void>
 *   workout  – existing workout for editing (null → create)
 */
export default function GymLogModal({ isOpen, onClose, onSubmit, workout }) {
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(workout);

  useEffect(() => {
    if (workout) {
      setForm({
        bodyPart: workout.bodyPart || workout.body_part || '',
        date: workout.date ? workout.date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
        duration: workout.duration ?? '',
        caloriesBurned: workout.caloriesBurned ?? '',
        notes: workout.notes || '',
        exercises: workout.exercises?.length
          ? workout.exercises.map((e) => ({
              name: e.name || '',
              sets: e.sets ?? '',
              reps: e.reps ?? '',
              weight: e.weight ?? '',
            }))
          : [{ ...BLANK_EX }],
      });
    } else {
      setForm({ ...BLANK, date: format(new Date(), 'yyyy-MM-dd'), exercises: [{ ...BLANK_EX }] });
    }
    setErrors({});
  }, [workout, isOpen]);

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  }

  function setEx(i, f, v) {
    setForm((p) => ({
      ...p,
      exercises: p.exercises.map((e, idx) => (idx === i ? { ...e, [f]: v } : e)),
    }));
  }

  function addEx() {
    setForm((p) => ({ ...p, exercises: [...p.exercises, { ...BLANK_EX }] }));
  }

  function removeEx(i) {
    setForm((p) => ({ ...p, exercises: p.exercises.filter((_, idx) => idx !== i) }));
  }

  function validate() {
    const e = {};
    if (!form.bodyPart) e.bodyPart = 'Select a body part';
    if (!form.date) e.date = 'Date is required';
    return e;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const payload = {
      ...form,
      duration: form.duration ? Number(form.duration) : undefined,
      caloriesBurned: form.caloriesBurned ? Number(form.caloriesBurned) : undefined,
      exercises: form.exercises
        .filter((ex) => ex.name.trim())
        .map((ex) => ({
          name: ex.name.trim(),
          sets: ex.sets ? Number(ex.sets) : undefined,
          reps: ex.reps ? Number(ex.reps) : undefined,
          weight: ex.weight ? Number(ex.weight) : undefined,
        })),
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <Dumbbell size={18} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {isEdit ? 'Edit Workout' : 'Log Workout'}
              </h2>
              <button
                onClick={onClose}
                className="ml-auto rounded-full p-1.5 text-slate-400 hover:bg-dark-600 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
              {errors.api && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {errors.api}
                </div>
              )}

              {/* Body part pills */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Body Part <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {BODY_PARTS.map((bp) => {
                    const active = form.bodyPart === bp.value;
                    const activeClass = BODY_PART_ACTIVE[bp.value] || 'bg-dark-600/60 text-slate-300 ring-dark-500';
                    return (
                      <button
                        key={bp.value}
                        type="button"
                        onClick={() => setField('bodyPart', bp.value)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition-all ${
                          active
                            ? `${activeClass} ring-2 scale-105 shadow-sm`
                            : 'bg-dark-700/60 text-slate-400 ring-dark-500/50 hover:text-white hover:bg-dark-600/60'
                        }`}
                      >
                        {bp.label}
                      </button>
                    );
                  })}
                </div>
                {errors.bodyPart && <p className="mt-1.5 text-xs text-red-400">{errors.bodyPart}</p>}
              </div>

              {/* Date + Duration + Calories */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setField('date', e.target.value)}
                    className="input-field !py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="60"
                    value={form.duration}
                    onChange={(e) => setField('duration', e.target.value)}
                    className="input-field !py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Calories
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="400"
                    value={form.caloriesBurned}
                    onChange={(e) => setField('caloriesBurned', e.target.value)}
                    className="input-field !py-2 text-sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="How did it go?"
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  className="input-field resize-none"
                />
              </div>

              {/* Exercises */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Exercises
                  </label>
                  <button
                    type="button"
                    onClick={addEx}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Plus size={11} /> Add Exercise
                  </button>
                </div>

                {/* Column hint */}
                <div className="mb-1.5 flex items-center gap-2 px-1 text-[10px] text-slate-600 uppercase tracking-wide">
                  <span className="flex-1">Name</span>
                  <span className="w-14 text-center">Sets</span>
                  <span className="w-14 text-center">Reps</span>
                  <span className="w-14 text-center">kg</span>
                  <span className="w-7" />
                </div>

                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {form.exercises.map((ex, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/40 p-2">
                          <input
                            type="text"
                            placeholder="Exercise name"
                            value={ex.name}
                            onChange={(e) => setEx(i, 'name', e.target.value)}
                            className="flex-1 min-w-0 rounded-lg bg-dark-800/60 border border-dark-500/50 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                          />
                          {['sets', 'reps', 'weight'].map((f) => (
                            <input
                              key={f}
                              type="number"
                              placeholder={f === 'weight' ? 'kg' : f}
                              min="0"
                              value={ex[f]}
                              onChange={(e) => setEx(i, f, e.target.value)}
                              className="w-14 rounded-lg bg-dark-800/60 border border-dark-500/50 px-1.5 py-1.5 text-xs text-center text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => removeEx(i)}
                            disabled={form.exercises.length === 1}
                            className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 size={12} />
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
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 py-2.5 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {isEdit ? 'Save Workout' : 'Log Workout'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
