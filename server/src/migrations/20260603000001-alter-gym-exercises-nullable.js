import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.changeColumn('gym_exercises', 'sets', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
  await queryInterface.changeColumn('gym_exercises', 'reps', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.query(`UPDATE gym_exercises SET sets = 0 WHERE sets IS NULL`);
  await queryInterface.sequelize.query(`UPDATE gym_exercises SET reps = 0 WHERE reps IS NULL`);
  await queryInterface.changeColumn('gym_exercises', 'sets', {
    type: DataTypes.INTEGER,
    allowNull: false,
  });
  await queryInterface.changeColumn('gym_exercises', 'reps', {
    type: DataTypes.INTEGER,
    allowNull: false,
  });
};
