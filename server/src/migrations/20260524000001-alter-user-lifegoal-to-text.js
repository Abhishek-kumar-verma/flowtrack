export const up = async (queryInterface, Sequelize) => {
  await queryInterface.changeColumn('users', 'lifeGoal', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.changeColumn('users', 'lifeGoal', {
    type: Sequelize.STRING, // VARCHAR(255)
    allowNull: true,
  });
};
