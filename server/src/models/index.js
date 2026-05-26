import sequelize from '../config/db.js';
import User from './User.js';
import Task from './Task.js';
import GymLog from './GymLog.js';
import GymExercise from './GymExercise.js';
import LearningLog from './LearningLog.js';
import Habit from './Habit.js';
import HabitLog from './HabitLog.js';
import DailyReport from './DailyReport.js';
import Quote from './Quote.js';
import MoodLog from './MoodLog.js';
import PomodoroSession from './PomodoroSession.js';

User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(GymLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
GymLog.belongsTo(User, { foreignKey: 'userId' });

GymLog.hasMany(GymExercise, { foreignKey: 'gymLogId', as: 'exercises', onDelete: 'CASCADE' });
GymExercise.belongsTo(GymLog, { foreignKey: 'gymLogId', as: 'gymLog' });

User.hasMany(LearningLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
LearningLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Habit, { foreignKey: 'userId', onDelete: 'CASCADE' });
Habit.belongsTo(User, { foreignKey: 'userId' });

Habit.hasMany(HabitLog, { foreignKey: 'habitId', as: 'logs', onDelete: 'CASCADE' });
HabitLog.belongsTo(Habit, { foreignKey: 'habitId' });

User.hasMany(HabitLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
HabitLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(DailyReport, { foreignKey: 'userId', onDelete: 'CASCADE' });
DailyReport.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(MoodLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
MoodLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(PomodoroSession, { foreignKey: 'userId', onDelete: 'CASCADE' });
PomodoroSession.belongsTo(User, { foreignKey: 'userId' });

Task.hasMany(PomodoroSession, { foreignKey: 'taskId', onDelete: 'SET NULL' });
PomodoroSession.belongsTo(Task, { foreignKey: 'taskId' });

export {
  sequelize,
  User,
  Task,
  GymLog,
  GymExercise,
  LearningLog,
  Habit,
  HabitLog,
  DailyReport,
  Quote,
  MoodLog,
  PomodoroSession,
};

const db = {
  sequelize,
  User,
  Task,
  GymLog,
  GymExercise,
  LearningLog,
  Habit,
  HabitLog,
  DailyReport,
  Quote,
  MoodLog,
  PomodoroSession,
};
export default db;
