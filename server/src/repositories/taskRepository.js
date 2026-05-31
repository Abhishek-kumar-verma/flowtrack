import { Op } from 'sequelize';
import { Task } from '../models/index.js';

export const findTasks = ({ where, order, offset, limit }) =>
  Task.findAndCountAll({ where, order, offset, limit });

export const findTaskById = (id, userId) =>
  Task.findOne({ where: { id, userId } });

export const createTask = (data) => Task.create(data);

export const updateTask = (id, data) =>
  Task.update(data, { where: { id }, returning: true }).then(([, rows]) => rows[0]);

export const deleteTask = (id) => Task.destroy({ where: { id } });

export const incrementTaskTime = (id, minutes) =>
  Task.increment('timeSpent', { by: minutes, where: { id } });

export const findTodaysTasks = (userId, start, end) =>
  Task.findAll({
    where: {
      userId,
      status: { [Op.ne]: 'CANCELLED' },      // Bug 6: exclude cancelled tasks from dashboard
      deadline: { [Op.between]: [start, end] },
    },
    order: [['createdAt', 'DESC']],
  });
