import { Habit, HabitLog } from '../models/index.js';
import { Op } from 'sequelize';

export const findHabits = (userId) =>
  Habit.findAll({ where: { userId }, order: [['createdAt', 'ASC']] });

export const findHabitsWithTodayLogs = (userId, start, end) =>
  Habit.findAll({
    where: { userId },
    include: [{ model: HabitLog, as: 'logs', where: { date: { [Op.between]: [start, end] } }, required: false }],
    order: [['createdAt', 'ASC']],
  });

export const findHabitById = (id, userId) =>
  Habit.findOne({ where: { id, userId } });

export const createHabit = (data) => Habit.create(data);

export const updateHabit = (id, data) =>
  Habit.update(data, { where: { id }, returning: true }).then(([, rows]) => rows[0]);

export const deleteHabit = async (id) => {
  await HabitLog.destroy({ where: { habitId: id } });
  return Habit.destroy({ where: { id } });
};

export const findHabitLogs = (habitId, order = [['date', 'DESC']]) =>
  HabitLog.findAll({ where: { habitId }, order, attributes: ['date'] });

export const findHabitLogToday = (habitId, start, end) =>
  HabitLog.findOne({ where: { habitId, date: { [Op.between]: [start, end] } } });

export const createHabitLog = (data) => HabitLog.create(data);

export const findHabitsWithLogs = (userId, since) =>
  Habit.findAll({
    where: { userId },
    include: [{ model: HabitLog, as: 'logs', where: { date: { [Op.gte]: since } }, required: false, attributes: ['id', 'date'] }],
    order: [['createdAt', 'ASC']],
  });
