import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername, updateUser } from '../repositories/userRepository.js';
import { generateUniqueUsername } from '../utils/generateUsername.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendAuthResponse = (res, statusCode, user) => {
  const token = signToken(user.id);
  return res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

const register = async (req, res, next) => {
  try {
    const { name, lifeGoal, dailyPriorities } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }

    let priorities = [];
    if (Array.isArray(dailyPriorities)) {
      priorities = dailyPriorities.filter((p) => typeof p === 'string' && p.trim());
    }

    const username = await generateUniqueUsername(name.trim());

    const userInstance = await createUser({
      name: name.trim(),
      username,
      lifeGoal: lifeGoal?.trim() || null,
      dailyPriorities: priorities,
    });

    const user = userInstance.toJSON();

    return sendAuthResponse(res, 201, user);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Username is required.',
      });
    }

    const userInstance = await findUserByUsername(username.trim().toLowerCase());

    if (!userInstance) {
      return res.status(401).json({
        success: false,
        message: 'No account found with that username.',
      });
    }

    const user = userInstance.toJSON();

    return sendAuthResponse(res, 200, user);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
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

    return res.status(200).json({
      success: true,
      message: 'Onboarding details updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export default { register, login, getMe, updateOnboarding };
