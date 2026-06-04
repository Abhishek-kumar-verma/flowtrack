import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const GymExercise = sequelize.define('GymExercise', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  gymLogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sets: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reps: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
  tableName: 'gym_exercises',
  timestamps: false,
});

export default GymExercise;
