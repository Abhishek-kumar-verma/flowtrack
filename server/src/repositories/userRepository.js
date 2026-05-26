import { User } from '../models/index.js';

export const createUser = (data) => User.create(data);

export const findUserByUsername = (username) =>
  User.findOne({ where: { username } });

export const findUserById = (id) =>
  User.findByPk(id);

export const updateUser = (id, data) =>
  User.update(data, { where: { id }, returning: true }).then(([, rows]) => rows[0]);
