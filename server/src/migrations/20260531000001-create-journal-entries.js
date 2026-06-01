import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('journal_entries', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    mood: {
      type: DataTypes.ENUM('GREAT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE'),
      allowNull: true,
    },
    tags: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('journal_entries', ['userId'], { name: 'idx_journal_entries_user_id' });
  await queryInterface.addIndex('journal_entries', ['userId', 'date'], { name: 'idx_journal_entries_user_date' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('journal_entries');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_journal_entries_mood";');
};
