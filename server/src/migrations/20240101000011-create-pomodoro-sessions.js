import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('pomodoro_sessions', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'tasks', key: 'id' },
      onDelete: 'SET NULL',
    },
    duration: { type: DataTypes.INTEGER, defaultValue: 25 },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    startedAt: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
    endedAt: { type: DataTypes.DATE, allowNull: true },
  });

  await queryInterface.addIndex('pomodoro_sessions', ['userId'], { name: 'idx_pomodoro_sessions_user_id' });
  await queryInterface.addIndex('pomodoro_sessions', ['userId', 'startedAt'], { name: 'idx_pomodoro_sessions_user_id_started_at' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('pomodoro_sessions');
};
