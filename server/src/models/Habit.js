import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Habit = sequelize.define('Habit', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  frequency: {
    type: DataTypes.ENUM('DAILY', 'WEEKLY'),
    defaultValue: 'DAILY',
  },
  targetCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  tableName: 'habits',
  timestamps: true,
  updatedAt: false,
});

export default Habit;
