import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('habits', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    frequency: {
      type: DataTypes.ENUM('DAILY', 'WEEKLY'),
      defaultValue: 'DAILY',
    },
    targetCount: { type: DataTypes.INTEGER, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('habits', ['userId'], { name: 'idx_habits_user_id' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('habits');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_habits_frequency";');
};
