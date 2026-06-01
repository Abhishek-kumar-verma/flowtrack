import { motion } from 'framer-motion';
import { Edit2, Trash2, Calendar, Tag } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const MOOD_CONFIG = {
  GREAT:   { label: 'Great',   emoji: '😄', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  GOOD:    { label: 'Good',    emoji: '🙂', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  NEUTRAL: { label: 'Neutral', emoji: '😐', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  BAD:     { label: 'Bad',     emoji: '😔', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  TERRIBLE:{ label: 'Terrible',emoji: '😢', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 260 } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export default function JournalCard({ entry, onEdit, onDelete }) {
  const mood = entry.mood ? MOOD_CONFIG[entry.mood] : null;
  const preview = entry.content.length > 200 ? entry.content.slice(0, 200) + '…' : entry.content;
  const tags = Array.isArray(entry.tags) ? entry.tags : [];

  return (
    <motion.div
      variants={cardVariants}
      layout
      className="group glass-card p-5 hover:border-primary-500/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Date */}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar size={11} />
              {format(parseISO(entry.date), 'MMM d, yyyy')}
            </span>

            {/* Mood badge */}
            {mood && (
              <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${mood.color}`}>
                {mood.emoji} {mood.label}
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-white truncate mb-1.5">{entry.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{preview}</p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Tag size={11} className="text-slate-600 mt-0.5" />
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 text-xs font-medium text-primary-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(entry)}
            className="p-2 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
