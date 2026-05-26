import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.ENUM('WORK', 'PERSONAL', 'LEARNING', 'HEALTH', 'DEEP_WORK', 'SIDE_PROJECT'),
    defaultValue: 'WORK',
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    defaultValue: 'MEDIUM',
  },
  status: {
    type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'TODO',
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'tasks',
  timestamps: true,
});

export default Task;
