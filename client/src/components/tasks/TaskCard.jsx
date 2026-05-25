import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Calendar, Tag, Pencil, Trash2, CheckCircle2, Circle, AlertCircle,
} from 'lucide-react';
import {
  formatDate,
  formatDuration,
  getPriorityColor,
  getPriorityBorderColor,
  getStatusColor,
  isOverdue,
} from '../../utils/formatters';
import { isToday, parseISO } from 'date-fns';

const PRIORITY_LABELS = { URGENT: 'Urgent', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };

/**
 * TaskCard – displays a single task with priority, status, deadline, actions.
 * Wrapped in React.memo — only re-renders when its specific `task` prop changes.
 *
 * Props:
 *   task           – task object
 *   onStatusChange – (id, newStatus) => void
 *   onEdit         – (task) => void
 *   onDelete       – (task) => void
 */
export default React.memo(function TaskCard({ task, onStatusChange, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const id = task._id || task.id;
  const deadline = task.deadline
    ? (typeof task.deadline === 'string' ? parseISO(task.deadline) : new Date(task.deadline))
    : null;
  const overdue = deadline ? isOverdue(deadline) : false;
  const dueToday = deadline ? isToday(deadline) : false;
  const isCompleted = task.status === 'COMPLETED';

  function handleToggle() {
    onStatusChange(id, isCompleted ? 'TODO' : 'COMPLETED');
  }

  const deadlineColor = overdue
    ? 'text-red-400'
    : dueToday
    ? 'text-amber-400'
    : 'text-slate-500';

  const borderColor = getPriorityBorderColor(task.priority);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative glass-card border-l-4 ${borderColor} hover:border-primary-500/30 hover:shadow-card-hover transition-all duration-300 overflow-hidden`}
    >
      <div className="p-4 sm:p-5">
        {/* ── Top row: priority + category + status ── */}
        <div className="flex items-start gap-2 mb-3 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(task.priority)}`}
          >
            {task.priority === 'URGENT' && <AlertCircle size={10} />}
            {PRIORITY_LABELS[task.priority] || task.priority}
          </span>

          {task.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-dark-600/60 border border-slate-200 dark:border-dark-500/50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Tag size={9} />
              {task.category}
            </span>
          )}

          <span
            className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}
          >
            {STATUS_LABELS[task.status] || task.status}
          </span>
        </div>

        {/* ── Title + description ── */}
        <div className="flex items-start gap-3">
          <button
            onClick={handleToggle}
            className="mt-0.5 shrink-0 text-slate-500 hover:text-primary-400 transition-colors"
            aria-label="Toggle completion"
          >
            {isCompleted ? (
              <CheckCircle2 size={20} className="text-green-400" />
            ) : (
              <Circle size={20} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-semibold leading-snug ${
                isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Footer: deadline + time + hover actions ── */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {deadline && (
            <span className={`flex items-center gap-1 text-xs font-medium ${deadlineColor}`}>
              <Calendar size={11} />
              {overdue && <span className="font-bold">Overdue · </span>}
              {formatDate(deadline)}
            </span>
          )}

          {task.timeSpent != null && task.timeSpent > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} />
              {formatDuration(task.timeSpent)}
            </span>
          )}

          <motion.div
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 6 }}
            transition={{ duration: 0.15 }}
            className="ml-auto flex items-center gap-1"
          >
            <button
              onClick={() => onEdit(task)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-500/10 hover:text-primary-400 transition-colors"
              aria-label="Edit task"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
})
