import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronDown, ChevronUp, Link2, Pencil, Trash2 } from 'lucide-react';
import { formatDate, formatDuration, getCategoryColor, CATEGORY_LABELS } from '../../utils/formatters';

const DIFFICULTY_CONFIG = {
  EASY:   { label: 'Easy',   emoji: '😊', color: 'bg-green-500/20 text-green-300' },
  MEDIUM: { label: 'Medium', emoji: '🤔', color: 'bg-amber-500/20 text-amber-300' },
  HARD:   { label: 'Hard',   emoji: '😤', color: 'bg-orange-500/20 text-orange-300' },
  EXPERT: { label: 'Expert', emoji: '🧠', color: 'bg-purple-500/20 text-purple-300' },
};

const NOTES_LIMIT = 200;

/**
 * LearningCard – displays one learning session.
 *
 * Props:
 *   session  – session object
 *   onEdit   – (session) => void
 *   onDelete – (session) => void
 */
export default function LearningCard({ session, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const diff = DIFFICULTY_CONFIG[session.difficulty] || DIFFICULTY_CONFIG.MEDIUM;
  const catColor = getCategoryColor(session.category);
  const catLabel = CATEGORY_LABELS[session.category] || session.category;
  const totalMinutes =
    session.timeSpent != null
      ? session.timeSpent
      : (session.hours || 0) * 60 + (session.minutes || 0);
  const resources = session.resources?.filter(Boolean) || [];
  const notes = session.notes || '';
  const notesLong = notes.length > NOTES_LIMIT;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="glass-card hover:border-primary-500/20 hover:shadow-card-hover transition-all duration-300"
    >
      <div className="p-5">
        {/* ── Top row ── */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${catColor}`}>
              {catLabel}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${diff.color}`}>
              {diff.emoji} {diff.label}
            </span>
          </div>
          <span className="shrink-0 flex items-center gap-1 text-xs text-slate-500">
            <Calendar size={10} />
            {formatDate(session.date)}
          </span>
        </div>

        {/* ── Topic title ── */}
        <h3 className="text-base font-semibold text-white leading-snug">{session.topic}</h3>

        {/* ── Notes ── */}
        {notes && (
          <div className="mt-2">
            <p className="text-sm text-slate-400 leading-relaxed">
              {expanded || !notesLong ? notes : notes.slice(0, NOTES_LIMIT) + '…'}
            </p>
            {notesLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 flex items-center gap-0.5 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                {expanded
                  ? <><ChevronUp size={11} /> Read less</>
                  : <><ChevronDown size={11} /> Read more</>
                }
              </button>
            )}
          </div>
        )}

        {/* ── Resources ── */}
        <AnimatePresence>
          {(expanded || resources.length <= 2) && resources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Resources
              </p>
              <ul className="space-y-1">
                {resources.map((r, i) => (
                  <li key={i}>
                    <a
                      href={r}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 hover:underline truncate transition-colors"
                    >
                      <Link2 size={10} className="shrink-0" />
                      {r}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer ── */}
        <div className="mt-3 flex items-center gap-4">
          {totalMinutes > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
              <Clock size={11} /> {formatDuration(totalMinutes)}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => onEdit(session)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-primary-500/10 hover:text-primary-400 transition-colors"
              aria-label="Edit session"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(session)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              aria-label="Delete session"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
