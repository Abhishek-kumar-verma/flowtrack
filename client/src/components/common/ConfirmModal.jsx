import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Generic confirmation dialog used before destructive actions (e.g. delete).
 *
 * Props:
 *   isOpen       – boolean
 *   onClose      – () => void
 *   onConfirm    – () => void
 *   title        – string  (default "Are you sure?")
 *   message      – string  (default "This action cannot be undone.")
 *   confirmLabel – string  (default "Delete")
 *   loading      – boolean
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  loading = false,
}) {
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
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="relative z-10 w-full max-w-md glass-card"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-dark-600 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center gap-4 px-8 py-8 text-center">
              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="text-red-400" size={32} />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{message}</p>
              </div>

              <div className="flex w-full gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="btn-ghost flex-1 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
