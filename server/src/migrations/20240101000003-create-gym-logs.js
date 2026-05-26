import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('gym_logs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    bodyPart: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    duration: { type: DataTypes.INTEGER, allowNull: false },
    caloriesBurned: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('gym_logs', ['userId'], { name: 'idx_gym_logs_user_id' });
  await queryInterface.addIndex('gym_logs', ['userId', 'date'], { name: 'idx_gym_logs_user_id_date' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('gym_logs');
};
