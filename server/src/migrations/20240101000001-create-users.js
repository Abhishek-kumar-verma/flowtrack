import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('users', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    lifeGoal: { type: DataTypes.TEXT, allowNull: true },
    dailyPriorities: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('users', ['username'], { name: 'idx_users_username' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('users');
};
