import { findUserByUsername } from '../repositories/userRepository.js';

export const generateUsername = (name) => {
  const firstName = name.trim().split(/\s+/)[0];
  const sanitized = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = sanitized || 'user';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${suffix}`;
};

export const generateUniqueUsername = async (name, maxAttempts = 10) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidate = generateUsername(name);
    const existing = await findUserByUsername(candidate);
    if (!existing) {
      return candidate;
    }
  }

  const firstName = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  return `${firstName}_${Date.now().toString().slice(-6)}`;
};
