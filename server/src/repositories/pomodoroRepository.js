import { PomodoroSession } from '../models/index.js';
import { Op } from 'sequelize';

export const createSession = (data) => PomodoroSession.create(data);

export const findSessionById = (id, userId) =>
  PomodoroSession.findOne({ where: { id, userId } });

export const updateSession = (id, data) =>
  PomodoroSession.update(data, { where: { id }, returning: true }).then(([, rows]) => rows[0]);

export const findSessionsByUser = (userId, { offset, limit } = {}) =>
  PomodoroSession.findAndCountAll({
    where: { userId },
    order: [['startedAt', 'DESC']],
    offset,
    limit,
  });

export const findTodaySessions = (userId, start, end) =>
  PomodoroSession.findAll({
    where: { userId, startedAt: { [Op.between]: [start, end] } },
  });
