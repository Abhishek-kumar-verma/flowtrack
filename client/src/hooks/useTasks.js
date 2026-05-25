import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';

/**
 * useTasks – custom hook for task CRUD + filtering + pagination.
 *
 * Exposed:
 *   tasks, loading, error
 *   filters { status, category, priority, search }
 *   setFilters(partial)
 *   page, totalPages, setPage
 *   fetchTasks()
 *   createTask(data)      → promise
 *   updateTask(id, data)  → promise
 *   deleteTask(id)        → promise
 *   updateStatus(id, status) → promise
 */
export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFiltersState] = useState({
    status: '',
    category: '',
    priority: '',
    search: '',
  });

  const setFilters = useCallback((partial) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;

      const { data } = await api.get('/tasks', { params });

      if (Array.isArray(data)) {
        setTasks(data);
        setTotalPages(1);
      } else {
        setTasks(data.tasks ?? data.data ?? []);
        setTotalPages(data.totalPages ?? data.pages ?? 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /**
   * createTask – optimistically prepends the new task to local state.
   * No dependency on `fetchTasks` → eliminates the dep-chain risk.
   */
  const createTask = useCallback(async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    const newTask = data.data || data.task || data;
    setTasks((prev) => [newTask, ...prev]);
    return data;
  }, []);

  const updateTask = useCallback(async (id, taskData) => {
    const { data } = await api.put(`/tasks/${id}`, taskData);
    const updated = data.data || data.task || data;
    setTasks((prev) => prev.map((t) => (t._id === id || t.id === id ? { ...t, ...updated } : t)));
    return data;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t._id !== id && t.id !== id));
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    const { data } = await api.patch(`/tasks/${id}/status`, { status });
    setTasks((prev) => prev.map((t) => (t._id === id || t.id === id ? { ...t, status } : t)));
    return data;
  }, []);

  return {
    tasks,
    loading,
    error,
    filters,
    setFilters,
    page,
    totalPages,
    setPage,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateStatus,
  };
}
