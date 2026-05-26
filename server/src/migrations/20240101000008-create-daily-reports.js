import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('daily_reports', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    completedTasks: { type: DataTypes.INTEGER, defaultValue: 0 },
    pendingTasks: { type: DataTypes.INTEGER, defaultValue: 0 },
    productivityScore: { type: DataTypes.FLOAT, defaultValue: 0 },
    disciplineScore: { type: DataTypes.FLOAT, defaultValue: 0 },
    timeManagementScore: { type: DataTypes.FLOAT, defaultValue: 0 },
    focusScore: { type: DataTypes.FLOAT, defaultValue: 0 },
    positiveHabits: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    weakAreas: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    suggestions: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    motivation: { type: DataTypes.STRING, allowNull: true },
    antiprocrastinationTip: { type: DataTypes.STRING, allowNull: true },
    fitnessConsistency: { type: DataTypes.STRING, allowNull: true },
    learningGrowth: { type: DataTypes.STRING, allowNull: true },
    aiSummary: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addConstraint('daily_reports', {
    fields: ['userId', 'date'],
    type: 'unique',
    name: 'daily_reports_user_date_unique',
  });

  await queryInterface.addIndex('daily_reports', ['userId'], { name: 'idx_daily_reports_user_id' });
  await queryInterface.addIndex('daily_reports', ['userId', 'date'], { name: 'idx_daily_reports_user_id_date' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('daily_reports');
};
