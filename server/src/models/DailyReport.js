import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const DailyReport = sequelize.define('DailyReport', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  completedTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pendingTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  productivityScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  disciplineScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  timeManagementScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  focusScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  positiveHabits: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  weakAreas: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  suggestions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  motivation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  antiprocrastinationTip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fitnessConsistency: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  learningGrowth: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  aiSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'daily_reports',
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'date'],
    },
  ],
});

export default DailyReport;
