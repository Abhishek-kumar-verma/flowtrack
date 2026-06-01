import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const JournalEntry = sequelize.define('JournalEntry', {
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
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  mood: {
    type: DataTypes.ENUM('GREAT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE'),
    allowNull: true,
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'journal_entries',
  timestamps: true,
});

export default JournalEntry;
