import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const LearningLog = sequelize.define('LearningLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('SYSTEM_DESIGN', 'BACKEND', 'DEVOPS', 'AI_ML', 'CLOUD', 'DSA', 'ARCHITECTURE', 'LEADERSHIP', 'ENGINEERING_MANAGEMENT'),
    allowNull: false,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resources: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT'),
    defaultValue: 'MEDIUM',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'learning_logs',
  timestamps: true,
  updatedAt: false,
});

export default LearningLog;
