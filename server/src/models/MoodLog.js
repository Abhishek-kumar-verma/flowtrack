import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MoodLog = sequelize.define('MoodLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mood: {
    type: DataTypes.ENUM('GREAT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE'),
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'mood_logs',
  timestamps: true,
  updatedAt: false,
});

export default MoodLog;
