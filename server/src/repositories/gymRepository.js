import { GymLog, GymExercise } from '../models/index.js';
import { Op } from 'sequelize';

export const findGymLogs = ({ where, offset, limit }) =>
  GymLog.findAndCountAll({
    where,
    include: [{ model: GymExercise, as: 'exercises' }],
    order: [['date', 'DESC']],
    offset,
    limit,
  });

export const findGymLogById = (id, userId) =>
  GymLog.findOne({
    where: { id, userId },
    include: [{ model: GymExercise, as: 'exercises' }],
  });

export const createGymLog = async (data, exercises = []) => {
  const log = await GymLog.create(data);
  if (exercises.length) {
    await GymExercise.bulkCreate(exercises.map((ex) => ({ ...ex, gymLogId: log.id })));
  }
  return GymLog.findByPk(log.id, { include: [{ model: GymExercise, as: 'exercises' }] });
};

export const updateGymLog = async (id, data, exercises) => {
  await GymLog.update(data, { where: { id } });
  if (Array.isArray(exercises)) {
    await GymExercise.destroy({ where: { gymLogId: id } });
    if (exercises.length) {
      await GymExercise.bulkCreate(exercises.map((ex) => ({ ...ex, gymLogId: id })));
    }
  }
  return GymLog.findByPk(id, { include: [{ model: GymExercise, as: 'exercises' }] });
};

export const deleteGymLog = async (id) => {
  await GymExercise.destroy({ where: { gymLogId: id } });
  return GymLog.destroy({ where: { id } });
};

export const findGymLogsByDateRange = (userId, start, end) =>
  GymLog.findAll({
    where: { userId, date: { [Op.between]: [start, end] } },
    order: [['date', 'ASC']],
    attributes: ['date', 'duration', 'bodyPart'],
  });

export const findAllGymLogDates = (userId) =>
  GymLog.findAll({
    where: { userId },
    order: [['date', 'DESC']],
    attributes: ['date'],
  });

export const findAllGymBodyParts = (userId) =>
  GymLog.findAll({ where: { userId }, attributes: ['bodyPart'] });

export const findTodaysGymLog = (userId, start, end) =>
  GymLog.findOne({
    where: { userId, date: { [Op.between]: [start, end] } },
    include: [{ model: GymExercise, as: 'exercises' }],
    order: [['date', 'DESC']],
  });
