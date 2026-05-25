import { useFormik } from 'formik';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ClipboardList } from 'lucide-react';
import {
  taskSchema,
  TASK_INITIAL_VALUES,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../../utils/taskValidation';

/**
 * TaskModal – create / edit task dialog (Formik-powered).
 *
 * Props:
 *   isOpen   – boolean
 *   onClose  – () => void
 *   onSubmit – (formData) => Promise<void>
 *   task     – task object for editing (null for create)
 */
export default function TaskModal({ isOpen, onClose, onSubmit, task }) {
  const isEdit = Boolean(task);

  const formik = useFormik({
    enableReinitialize: true,   // re-populates when `task` prop changes (edit mode)
    initialValues: task
      ? {
          title:       task.title       || '',
          description: task.description || '',
          category:    task.category    || '',
          priority:    task.priority    || 'MEDIUM',
          deadline:    task.deadline    ? task.deadline.slice(0, 10) : '',
          status:      task.status      || 'TODO',
        }
      : TASK_INITIAL_VALUES,
    validationSchema: taskSchema,
    onSubmit: async (values, { setSubmitting, setFieldError, resetForm }) => {
      try {
        await onSubmit(values);
        resetForm();
        onClose();
      } catch (err) {
        setFieldError('api', err.response?.data?.message || err.message || 'Something went wrong');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Show error only after the field has been touched
  const fieldError = (name) => formik.touched[name] && formik.errors[name];

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="relative z-10 w-full max-w-lg glass-card flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-dark-600/50 px-6 py-4 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10">
                <ClipboardList size={18} className="text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isEdit ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={handleClose}
                className="ml-auto rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-600 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
              {formik.errors.api && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {formik.errors.api}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="What needs to be done?"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-field ${fieldError('title') ? 'border-red-500/60 focus:border-red-500' : ''}`}
                  autoFocus
                />
                {fieldError('title') && (
                  <p className="mt-1 text-xs text-red-400">{fieldError('title')}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </label>
                <textarea
                  rows={3}
                  name="description"
                  placeholder="Add details…"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input-field resize-none"
                />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    className="input-field"
                  >
                    <option value="">None</option>
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formik.values.priority}
                    onChange={formik.handleChange}
                    className="input-field"
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deadline + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Deadline
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formik.values.deadline}
                    onChange={formik.handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formik.values.status}
                    onChange={formik.handleChange}
                    className="input-field"
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {formik.isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {isEdit ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
