import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PomodoroSession = sequelize.define('PomodoroSession', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 25,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'pomodoro_sessions',
  timestamps: false,
});

export default PomodoroSession;
