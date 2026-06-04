import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createUser, findUserByUsername, findUserById, updateUser } from '../repositories/userRepository.js';
import { generateUniqueUsername } from '../utils/generateUsername.js';
import RefreshToken from '../models/RefreshToken.js';

const REFRESH_TOKEN_EXPIRES_DAYS = 30;

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const createRefreshToken = async (userId) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  await RefreshToken.create({ token, userId, expiresAt });
  return token;
};

const sendAuthResponse = async (res, statusCode, user) => {
  const token = signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);
  return res.status(statusCode).json({ success: true, token, refreshToken, user });
};

const register = async (req, res, next) => {
  try {
    const { name, lifeGoal, dailyPriorities, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    let priorities = [];
    if (Array.isArray(dailyPriorities)) {
      priorities = dailyPriorities.filter((p) => typeof p === 'string' && p.trim());
    }

    const username = await generateUniqueUsername(name.trim());
    const hashedPassword = await bcrypt.hash(password, 10);

    const userInstance = await createUser({
      name: name.trim(),
      username,
      password: hashedPassword,
      lifeGoal: lifeGoal?.trim() || null,
      dailyPriorities: priorities,
    });

    const user = userInstance.toJSON();
    delete user.password;

    return sendAuthResponse(res, 201, user);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const userInstance = await findUserByUsername(username.trim().toLowerCase());
    if (!userInstance) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, userInstance.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = userInstance.toJSON();
    delete user.password;

    return sendAuthResponse(res, 200, user);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

const updateOnboarding = async (req, res, next) => {
  try {
    const { lifeGoal, dailyPriorities } = req.body;
    const userId = req.user.id;

    const updateData = {};

    if (typeof lifeGoal !== 'undefined') {
      updateData.lifeGoal = typeof lifeGoal === 'string' ? lifeGoal.trim() || null : null;
    }

    if (Array.isArray(dailyPriorities)) {
      updateData.dailyPriorities = dailyPriorities.filter(
        (p) => typeof p === 'string' && p.trim().length > 0
      );
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update: lifeGoal or dailyPriorities.',
      });
    }

    const updatedInstance = await updateUser(userId, updateData);
    const updatedUser = updatedInstance.toJSON();
    delete updatedUser.password;

    return res.status(200).json({
      success: true,
      message: 'Onboarding details updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const record = await RefreshToken.findOne({ where: { token } });

    if (!record || record.expiresAt < new Date()) {
      if (record) await record.destroy();
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token. Please log in again.' });
    }

    const user = await findUserById(record.userId);
    if (!user) {
      await record.destroy();
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // Rotate: delete old, issue new
    await record.destroy();
    const newAccessToken = signAccessToken(user.id);
    const newRefreshToken = await createRefreshToken(user.id);

    return res.json({ success: true, token: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await RefreshToken.destroy({ where: { token } });
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

export default { register, login, getMe, updateOnboarding, refreshToken, logout };
