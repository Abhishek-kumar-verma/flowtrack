import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('tasks', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    category: {
      type: DataTypes.ENUM('WORK', 'PERSONAL', 'LEARNING', 'HEALTH', 'DEEP_WORK', 'SIDE_PROJECT'),
      defaultValue: 'WORK',
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      defaultValue: 'MEDIUM',
    },
    status: {
      type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'TODO',
    },
    deadline: { type: DataTypes.DATE, allowNull: true },
    timeSpent: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('tasks', ['userId'], { name: 'idx_tasks_user_id' });
  await queryInterface.addIndex('tasks', ['userId', 'status'], { name: 'idx_tasks_user_id_status' });
  await queryInterface.addIndex('tasks', ['userId', 'deadline'], { name: 'idx_tasks_user_id_deadline' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('tasks');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_category";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_priority";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_status";');
};
