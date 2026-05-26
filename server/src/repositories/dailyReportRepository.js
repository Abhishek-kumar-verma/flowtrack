import { DailyReport } from '../models/index.js';
import { Op } from 'sequelize';

export const findReportByUserAndDate = (userId, date) =>
  DailyReport.findOne({ where: { userId, date } });

export const findReportsByUser = (userId, { offset, limit } = {}) =>
  DailyReport.findAndCountAll({
    where: { userId },
    order: [['date', 'DESC']],
    offset,
    limit,
  });

export const createReport = (data) => DailyReport.create(data);

export const upsertReport = (userId, date, data) =>
  DailyReport.upsert({ userId, date, ...data });

export const findReportsByDateRange = (userId, start, end) =>
  DailyReport.findAll({
    where: { userId, date: { [Op.between]: [start, end] } },
    order: [['date', 'ASC']],
  });
