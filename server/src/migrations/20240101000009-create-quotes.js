import { DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.createTable('quotes', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    author: { type: DataTypes.STRING, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.DATEONLY, defaultValue: Sequelize.NOW },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('quotes', ['date'], { name: 'idx_quotes_date' });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('quotes');
};
