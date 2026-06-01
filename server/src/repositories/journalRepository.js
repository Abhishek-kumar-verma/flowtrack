import { JournalEntry } from '../models/index.js';
import { Op } from 'sequelize';

export const createEntry = (data) => JournalEntry.create(data);

export const findEntries = (userId, { offset, limit, mood } = {}) => {
  const where = { userId };
  if (mood) where.mood = mood;
  return JournalEntry.findAndCountAll({
    where,
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
    offset,
    limit,
  });
};

export const findEntryById = (id, userId) =>
  JournalEntry.findOne({ where: { id, userId } });

export const findEntryByDate = (userId, date) =>
  JournalEntry.findOne({ where: { userId, date }, order: [['createdAt', 'DESC']] });

export const findEntriesByRange = (userId, start, end) =>
  JournalEntry.findAll({
    where: { userId, date: { [Op.between]: [start, end] } },
    order: [['date', 'DESC']],
  });

export const updateEntry = (id, userId, data) =>
  JournalEntry.update(data, { where: { id, userId }, returning: true })
    .then(([, rows]) => rows[0]);

export const deleteEntry = (id, userId) =>
  JournalEntry.destroy({ where: { id, userId } });

export const countEntries = (userId) =>
  JournalEntry.count({ where: { userId } });

export const countEntriesThisMonth = (userId) => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return JournalEntry.count({ where: { userId, date: { [Op.gte]: start.toISOString().split('T')[0] } } });
};

export const countEntriesThisWeek = (userId) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  return JournalEntry.count({ where: { userId, date: { [Op.gte]: start.toISOString().split('T')[0] } } });
};
