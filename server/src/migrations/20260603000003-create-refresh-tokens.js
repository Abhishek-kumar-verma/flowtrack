import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('refresh_tokens', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    token: { type: DataTypes.TEXT, allowNull: false, unique: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('refresh_tokens', ['token'], { name: 'idx_refresh_tokens_token' });
  await queryInterface.addIndex('refresh_tokens', ['userId'], { name: 'idx_refresh_tokens_user_id' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('refresh_tokens');
};
