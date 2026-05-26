import { LearningLog } from '../models/index.js';
import { Op } from 'sequelize';

export const findLearningLogs = ({ where, order, offset, limit }) =>
  LearningLog.findAndCountAll({ where, order, offset, limit });

export const findLearningLogById = (id, userId) =>
  LearningLog.findOne({ where: { id, userId } });

export const createLearningLog = (data) => LearningLog.create(data);

export const updateLearningLog = (id, data) =>
  LearningLog.update(data, { where: { id }, returning: true }).then(([, rows]) => rows[0]);

export const deleteLearningLog = (id) => LearningLog.destroy({ where: { id } });

export const findLearningLogsByDateRange = (userId, start, end) =>
  LearningLog.findAll({
    where: { userId, date: { [Op.between]: [start, end] } },
    attributes: ['date', 'timeSpent', 'category'],
  });
