import { Op } from 'sequelize';
import {
  findTasks,
  findTaskById,
  createTask as createTaskInDB,
  updateTask as updateTaskInDB,
  deleteTask as deleteTaskInDB,
  incrementTaskTime,
  findTodaysTasks,
} from '../repositories/taskRepository.js';

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const isValidDate = (str) => {
  const d = new Date(str);
  return !isNaN(d.getTime());
};

const VALID_STATUSES   = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const VALID_CATEGORIES = ['WORK', 'PERSONAL', 'LEARNING', 'HEALTH', 'DEEP_WORK', 'SIDE_PROJECT'];

const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      status,
      category,
      priority,
      date,
      search,
      page    = 1,
      limit   = 20,
      sortBy  = 'createdAt',
      order   = 'desc',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const where = { userId };

    // Opt-5: exclude CANCELLED by default unless the caller explicitly requests it
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    } else if (!status) {
      where.status = { [Op.ne]: 'CANCELLED' };
    }

    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (priority && VALID_PRIORITIES.includes(priority)) where.priority = priority;

    if (date === 'today') {
      const { start, end } = todayRange();
      where.deadline = { [Op.between]: [start, end] };
    }

    // Bug 5: case-insensitive search on title and description
    if (search && search.trim()) {
      where[Op.or] = [
        { title:       { [Op.iLike]: `%${search.trim()}%` } },
        { description: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    let seqOrder;
    if (sortBy === 'priority') {
      seqOrder = [['priority', order.toUpperCase()], ['createdAt', 'DESC']];
    } else if (sortBy === 'deadline') {
      seqOrder = [['deadline', order === 'asc' ? 'ASC' : 'DESC'], ['createdAt', 'DESC']];
    } else {
      seqOrder = [['createdAt', order.toUpperCase()]];
    }

    const { count: total, rows: tasks } = await findTasks({
      where,
      order : seqOrder,
      offset: skip,
      limit : limitNum,
    });

    return res.json({
      success : true,
      data    : tasks,
      pagination: {
        total,
        page     : pageNum,
        limit    : limitNum,
        pages    : Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('getTasks error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTask = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const task = await findTaskById(id, userId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.json({ success: true, data: task });
  } catch (err) {
    console.error('getTask error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, category, priority, status, timeSpent, deadline } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success : false,
        message : `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success : false,
        message : `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    if (deadline && !isValidDate(deadline)) {
      return res.status(400).json({ success: false, message: 'Invalid deadline date' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success : false,
        message : `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (timeSpent !== undefined && (isNaN(Number(timeSpent)) || Number(timeSpent) < 0)) {
      return res.status(400).json({ success: false, message: 'timeSpent must be a non-negative number' });
    }

    const task = await createTaskInDB({
      userId,
      title      : title.trim(),
      description: description?.trim() ?? null,
      category   : category ?? 'PERSONAL',
      priority   : priority ?? 'MEDIUM',
      status     : status ?? 'TODO',
      timeSpent  : timeSpent != null ? Number(timeSpent) : 0,
      deadline   : deadline ? new Date(deadline) : null,
    });

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error('createTask error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const existing = await findTaskById(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, category, priority, status, deadline } = req.body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success : false,
        message : `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success : false,
        message : `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success : false,
        message : `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (deadline && !isValidDate(deadline)) {
      return res.status(400).json({ success: false, message: 'Invalid deadline date' });
    }

    const updateData = {};
    if (title       !== undefined) updateData.title       = title.trim();
    if (description !== undefined) updateData.description = description?.trim() ?? null;
    if (category    !== undefined) updateData.category    = category;
    if (priority    !== undefined) updateData.priority    = priority;
    if (status      !== undefined) updateData.status      = status;
    if (deadline    !== undefined) updateData.deadline    = deadline ? new Date(deadline) : null;

    const task = await updateTaskInDB(id, updateData);

    return res.json({ success: true, data: task });
  } catch (err) {
    console.error('updateTask error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const id         = parseInt(req.params.id, 10);
    const userId     = req.user.id;
    const softDelete = req.query.soft === 'true';

    const existing = await findTaskById(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (softDelete) {
      const task = await updateTaskInDB(id, { status: 'CANCELLED' });
      return res.json({ success: true, data: task, message: 'Task marked as cancelled' });
    }

    await deleteTaskInDB(id);

    return res.json({ success: true, message: 'Task permanently deleted' });
  } catch (err) {
    console.error('deleteTask error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success : false,
        message : `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const existing = await findTaskById(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = await updateTaskInDB(id, { status });

    return res.json({ success: true, data: task });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const logTime = async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { minutes, timeSpent: timeSpentField } = req.body;
    const value = minutes ?? timeSpentField;

    if (value === undefined || isNaN(Number(value)) || Number(value) <= 0) {
      return res.status(400).json({ success: false, message: 'A positive "minutes" or "timeSpent" value is required' });
    }

    const existing = await findTaskById(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await incrementTaskTime(id, Number(value));

    const task = await findTaskById(id, userId);

    return res.json({ success: true, data: task });
  } catch (err) {
    console.error('logTime error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTodaysTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = todayRange();

    const tasks = await findTodaysTasks(userId, start, end);

    return res.json({ success: true, data: tasks, count: tasks.length });
  } catch (err) {
    console.error('getTodaysTasks error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { getTasks, getTask, createTask, updateTask, deleteTask, updateTaskStatus, logTime, getTodaysTasks };
