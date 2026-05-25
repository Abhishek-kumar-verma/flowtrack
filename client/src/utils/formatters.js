/**
 * formatters.js – shared utility functions for the Daily Progress Tracker
 */

import { format, isToday, isTomorrow, isYesterday, parseISO, differenceInDays, isPast } from 'date-fns';

/**
 * Smart date formatting – returns a human-readable date string.
 */
export function formatDate(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

/**
 * Format total minutes → "1h 30m"
 */
export function formatDuration(minutes) {
  if (minutes == null || minutes < 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Relative date: "Today", "Tomorrow", "Yesterday", "3 days ago", "in 5 days"
 */
export function getRelativeDate(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  const diff = differenceInDays(d, new Date());
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `in ${diff} days`;
}

/**
 * Tailwind color classes for a learning category (dark-theme aware).
 */
export function getCategoryColor(category) {
  const map = {
    SYSTEM_DESIGN: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    BACKEND: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    DEVOPS: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    AI_ML: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    CLOUD: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    DSA: 'bg-green-500/20 text-green-300 border-green-500/30',
    ARCHITECTURE: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    LEADERSHIP: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    ENGINEERING_MANAGEMENT: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };
  return map[category] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
}

/**
 * Tailwind classes for task priority (dark-theme).
 */
export function getPriorityColor(priority) {
  const map = {
    URGENT: 'bg-red-500/20 text-red-300 border-red-500/30',
    HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    MEDIUM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return map[priority] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

/**
 * Left-border accent for priority cards.
 */
export function getPriorityBorderColor(priority) {
  const map = {
    URGENT: 'border-red-500',
    HIGH: 'border-orange-500',
    MEDIUM: 'border-blue-500',
    LOW: 'border-slate-500',
  };
  return map[priority] || 'border-slate-500';
}

/**
 * Status badge classes (dark-theme).
 */
export function getStatusColor(status) {
  const map = {
    TODO: 'bg-slate-500/20 text-slate-400',
    IN_PROGRESS: 'bg-amber-500/20 text-amber-300',
    COMPLETED: 'bg-green-500/20 text-green-300',
  };
  return map[status] || 'bg-slate-500/20 text-slate-400';
}

/**
 * Body part badge color for gym tracker (dark-theme).
 */
export function getBodyPartColor(part) {
  const map = {
    CHEST: 'bg-red-500/20 text-red-300',
    BACK: 'bg-blue-500/20 text-blue-300',
    LEGS: 'bg-green-500/20 text-green-300',
    SHOULDERS: 'bg-orange-500/20 text-orange-300',
    ARMS: 'bg-purple-500/20 text-purple-300',
    CORE: 'bg-yellow-500/20 text-yellow-300',
    FULL_BODY: 'bg-pink-500/20 text-pink-300',
    CARDIO: 'bg-cyan-500/20 text-cyan-300',
  };
  return map[part] || 'bg-slate-500/20 text-slate-300';
}

/**
 * Returns true if a deadline is past and not today.
 */
export function isOverdue(date) {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isPast(d) && !isToday(d);
}

/**
 * Display names for learning categories.
 */
export const CATEGORY_LABELS = {
  SYSTEM_DESIGN: 'System Design',
  BACKEND: 'Backend Engineering',
  DEVOPS: 'DevOps',
  AI_ML: 'AI / ML',
  CLOUD: 'Cloud',
  DSA: 'DSA',
  ARCHITECTURE: 'Architecture',
  LEADERSHIP: 'Leadership',
  ENGINEERING_MANAGEMENT: 'Eng. Management',
};
