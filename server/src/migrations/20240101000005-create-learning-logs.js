import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('learning_logs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    topic: { type: DataTypes.STRING, allowNull: false },
    category: {
      type: DataTypes.ENUM(
        'SYSTEM_DESIGN',
        'BACKEND',
        'DEVOPS',
        'AI_ML',
        'CLOUD',
        'DSA',
        'ARCHITECTURE',
        'LEADERSHIP',
        'ENGINEERING_MANAGEMENT'
      ),
      allowNull: false,
    },
    notes: { type: DataTypes.STRING, allowNull: true },
    resources: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    timeSpent: { type: DataTypes.INTEGER, allowNull: false },
    difficulty: {
      type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT'),
      defaultValue: 'MEDIUM',
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('learning_logs', ['userId'], { name: 'idx_learning_logs_user_id' });
  await queryInterface.addIndex('learning_logs', ['userId', 'date'], { name: 'idx_learning_logs_user_id_date' });
  await queryInterface.addIndex('learning_logs', ['userId', 'category'], { name: 'idx_learning_logs_user_id_category' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('learning_logs');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_learning_logs_category";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_learning_logs_difficulty";');
};
