import { MoodLog } from '../models/index.js';
import { Op } from 'sequelize';

export const createMoodLog = (data) => MoodLog.create(data);

export const findMoodLogs = (userId, { offset, limit } = {}) =>
  MoodLog.findAndCountAll({
    where: { userId },
    order: [['date', 'DESC']],
    offset,
    limit,
  });

export const findMoodLogByDate = (userId, date) =>
  MoodLog.findOne({ where: { userId, date } });

export const findMoodLogsByRange = (userId, start, end) =>
  MoodLog.findAll({
    where: { userId, date: { [Op.between]: [start, end] } },
    order: [['date', 'ASC']],
  });
