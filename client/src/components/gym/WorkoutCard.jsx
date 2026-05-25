import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Pencil, Trash2, Flame, Clock, Dumbbell } from 'lucide-react';
import { formatDuration, getBodyPartColor } from '../../utils/formatters';

const BODY_PART_LABELS = {
  CHEST: 'Chest', BACK: 'Back', LEGS: 'Legs', SHOULDERS: 'Shoulders',
  ARMS: 'Arms', CORE: 'Core', FULL_BODY: 'Full Body', CARDIO: 'Cardio',
};

/**
 * WorkoutCard – a single gym session with an expandable exercise list.
 *
 * Props:
 *   workout  – workout object
 *   onEdit   – (workout) => void
 *   onDelete – (workout) => void
 *   isToday  – boolean
 */
export default function WorkoutCard({ workout, onEdit, onDelete, isToday = false }) {
  const [expanded, setExpanded] = useState(isToday);

  const exercises = workout.exercises || [];
  const bp = workout.bodyPart || workout.body_part;
  const bodyPartColor = getBodyPartColor(bp);
  const bodyPartLabel = BODY_PART_LABELS[bp] || bp;

  const dateObj = workout.date
    ? (typeof workout.date === 'string' ? new Date(workout.date) : workout.date)
    : new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className={`glass-card overflow-hidden hover:shadow-card-hover transition-all duration-300 ${
        isToday ? 'ring-2 ring-emerald-500/40' : ''
      }`}
    >
      {isToday && (
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-1.5 text-xs font-semibold text-white tracking-wide">
          Today's Workout
        </div>
      )}

      {/* Card header – click to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-dark-700/30 transition-colors"
      >
        {/* Date block */}
        <div className="shrink-0 text-center w-12">
          <p className="text-xl font-bold text-white leading-none">{dateObj.getDate()}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">
            {dateObj.toLocaleString('default', { month: 'short' })}
          </p>
        </div>

        <div className="h-10 w-px bg-dark-600/60 shrink-0" />

        {/* Body part + exercise count */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${bodyPartColor}`}>
              {bodyPartLabel}
            </span>
            {exercises.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Dumbbell size={10} />
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {workout.notes && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">{workout.notes}</p>
          )}
        </div>

        {/* Stats */}
        <div className="shrink-0 flex items-center gap-3">
          {workout.duration && (
            <span className="flex items-center gap-1 text-sm font-medium text-slate-300">
              <Clock size={12} className="text-slate-500" />
              {formatDuration(workout.duration)}
            </span>
          )}
          {workout.caloriesBurned && (
            <span className="flex items-center gap-1 text-sm font-medium text-amber-400">
              <Flame size={12} />
              {workout.caloriesBurned}
            </span>
          )}
          {expanded
            ? <ChevronUp size={15} className="text-slate-500" />
            : <ChevronDown size={15} className="text-slate-500" />
          }
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="overflow-hidden"
          >
            <div className="border-t border-dark-600/50 px-5 pb-5 pt-4">
              {exercises.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-wide text-[10px]">
                      <th className="pb-2 text-left font-semibold">Exercise</th>
                      <th className="pb-2 text-center font-semibold">Sets</th>
                      <th className="pb-2 text-center font-semibold">Reps</th>
                      <th className="pb-2 text-right font-semibold">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-600/30">
                    {exercises.map((ex, i) => (
                      <tr key={i} className="text-slate-300">
                        <td className="py-1.5 font-medium">{ex.name}</td>
                        <td className="py-1.5 text-center text-slate-400">{ex.sets ?? '—'}</td>
                        <td className="py-1.5 text-center text-slate-400">{ex.reps ?? '—'}</td>
                        <td className="py-1.5 text-right text-slate-400">
                          {ex.weight ? `${ex.weight} kg` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-slate-500 italic">No exercises logged.</p>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(workout)}
                  className="flex items-center gap-1.5 btn-ghost text-xs py-1.5 px-3"
                >
                  <Pencil size={11} /> Edit
                </button>
                <button
                  onClick={() => onDelete(workout)}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors"
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
