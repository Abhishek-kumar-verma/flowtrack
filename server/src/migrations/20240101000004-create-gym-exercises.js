import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('gym_exercises', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gymLogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'gym_logs', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING, allowNull: false },
    sets: { type: DataTypes.INTEGER, allowNull: false },
    reps: { type: DataTypes.INTEGER, allowNull: false },
    weight: { type: DataTypes.FLOAT, allowNull: true },
  });

  await queryInterface.addIndex('gym_exercises', ['gymLogId'], { name: 'idx_gym_exercises_gym_log_id' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('gym_exercises');
};
