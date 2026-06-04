import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export const up = async (queryInterface) => {
  await queryInterface.addColumn('users', 'password', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  const [users] = await queryInterface.sequelize.query('SELECT id, username FROM users');
  for (const user of users) {
    const hash = await bcrypt.hash(user.username, 10);
    await queryInterface.sequelize.query(
      `UPDATE users SET password = :hash WHERE id = :id`,
      { replacements: { hash, id: user.id } }
    );
  }

  await queryInterface.changeColumn('users', 'password', {
    type: DataTypes.STRING(255),
    allowNull: false,
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeColumn('users', 'password');
};
