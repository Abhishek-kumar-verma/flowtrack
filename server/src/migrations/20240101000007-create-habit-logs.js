import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('habit_logs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    habitId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'habits', key: 'id' },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    completedAt: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
    date: { type: DataTypes.DATEONLY, allowNull: false },
  });

  await queryInterface.addIndex('habit_logs', ['habitId'], { name: 'idx_habit_logs_habit_id' });
  await queryInterface.addIndex('habit_logs', ['userId'], { name: 'idx_habit_logs_user_id' });
  await queryInterface.addIndex('habit_logs', ['userId', 'date'], { name: 'idx_habit_logs_user_id_date' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('habit_logs');
};
