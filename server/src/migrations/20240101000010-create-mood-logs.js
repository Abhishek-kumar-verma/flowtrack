import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('mood_logs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    mood: {
      type: DataTypes.ENUM('GREAT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE'),
      allowNull: false,
    },
    note: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('mood_logs', ['userId'], { name: 'idx_mood_logs_user_id' });
  await queryInterface.addIndex('mood_logs', ['userId', 'date'], { name: 'idx_mood_logs_user_id_date' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('mood_logs');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_mood_logs_mood";');
};
