import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, SlidersHorizontal, ClipboardList,
  ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';
import Layout from '../components/common/Layout.jsx';
import useTasks from '../hooks/useTasks';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { useDebounce } from '../hooks/useDebounce';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const CATEGORIES = [
  { value: '',             label: 'All Categories' },
  { value: 'WORK',         label: 'Work' },
  { value: 'PERSONAL',     label: 'Personal' },
  { value: 'LEARNING',     label: 'Learning' },
  { value: 'HEALTH',       label: 'Health' },
  { value: 'DEEP_WORK',    label: 'Deep Work' },
  { value: 'SIDE_PROJECT', label: 'Side Project' },
];

const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function Tasks() {
  const {
    tasks, loading, error,
    filters, setFilters,
    page, totalPages, setPage,
    createTask, updateTask, deleteTask, updateStatus,
  } = useTasks();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmTask, setConfirmTask] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Debounced search (Phase 3) ──────────────────────────────────────────
  // Local state drives the input instantly; debounced value hits the API
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 350);

  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  // ── Memoized handlers (Phase 3) ─────────────────────────────────────────
  const openCreate = useCallback(() => { setEditingTask(null); setModalOpen(true); }, []);
  const openEdit   = useCallback((task) => { setEditingTask(task); setModalOpen(true); }, []);
  const handleConfirmDelete = useCallback((t) => setConfirmTask(t), []);

  const handleSubmit = useCallback(async (formData) => {
    if (editingTask) {
      await updateTask(editingTask._id || editingTask.id, formData);
    } else {
      await createTask(formData);
    }
  }, [editingTask, updateTask, createTask]);

  const handleDelete = useCallback(async () => {
    if (!confirmTask) return;
    setDeleteLoading(true);
    try {
      await deleteTask(confirmTask._id || confirmTask.id);
      setConfirmTask(null);
    } finally {
      setDeleteLoading(false);
    }
  }, [confirmTask, deleteTask]);

  const pageNums = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  return (
    <Layout title="Task Manager">
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-4xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Task Manager</h1>
            <p className="mt-1 text-sm text-slate-500">Manage and track all your tasks</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 text-sm shrink-0"
          >
            <Plus size={16} /> New Task
          </motion.button>
        </div>

        {/* ── Filter bar ── */}
        <div className="space-y-3">
          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-700/60 rounded-xl p-1 w-fit border border-slate-200 dark:border-dark-500/50">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilters({ status: tab.value })}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  filters.status === tab.value
                    ? 'bg-primary-600 text-white shadow-glow-primary'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category + Priority + Search */}
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal size={14} className="text-slate-500 shrink-0" />

            <select
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value })}
              className="input-field !py-1.5 !px-3 text-xs w-auto"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ priority: e.target.value })}
              className="input-field !py-1.5 !px-3 text-xs w-auto"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {/* Debounced search input (Phase 3) */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tasks…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field !py-1.5 !pl-8 !pr-3 text-xs"
              />
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* ── Task list ── */}
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-500/50 bg-slate-50 dark:bg-dark-800/40 py-20 px-8 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500/10">
              <ClipboardList size={36} className="text-primary-400/60" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No tasks found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              {filters.status || filters.category || filters.priority || filters.search
                ? 'Try adjusting your filters or clear the search.'
                : 'Get started by creating your first task.'}
            </p>
            <button
              onClick={openCreate}
              className="btn-primary mt-5 flex items-center gap-2 text-sm"
            >
              <Plus size={14} /> New Task
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id || task.id}
                  task={task}
                  onStatusChange={updateStatus}
                  onEdit={openEdit}
                  onDelete={handleConfirmDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 dark:border-dark-500/50 bg-white dark:bg-dark-700/60 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-primary-500/40 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            {pageNums.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-xl text-sm font-medium transition-all ${
                  p === page
                    ? 'bg-primary-600 text-white shadow-glow-primary'
                    : 'border border-slate-200 dark:border-dark-500/50 bg-white dark:bg-dark-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-primary-500/40'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-slate-200 dark:border-dark-500/50 bg-white dark:bg-dark-700/60 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-primary-500/40 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        task={editingTask}
      />
      <ConfirmModal
        isOpen={Boolean(confirmTask)}
        onClose={() => setConfirmTask(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Task?"
        message={`"${confirmTask?.title}" will be permanently deleted.`}
        confirmLabel="Delete Task"
      />
    </Layout>
  );
}
