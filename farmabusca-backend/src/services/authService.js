const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const {
  normalizeEmail,
  normalizeSelfRegisterRole,
  sanitizeUser,
} = require('../utils/authPolicy');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET deve ser configurado nas variáveis de ambiente');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const hashPassword = async (password) => bcrypt.hash(password, 10);

const comparePassword = async (password, hashedPassword) => bcrypt.compare(password, hashedPassword);

const signToken = (user) => jwt.sign({ id: user.id, role: String(user.role || 'PATIENT').toUpperCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const registerUser = async ({ name, email, phone, password, role = 'PATIENT' }) => {
  const normalizedRole = normalizeSelfRegisterRole(role);
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    const error = new Error('Email já existe');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name: String(name || '').trim(),
    email: normalizedEmail,
    phone: String(phone || '').trim(),
    password: hashedPassword,
    role: normalizedRole,
  });
  return { user: sanitizeUser(user), token: signToken(user) };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    const error = new Error('Credenciais inválidas');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const error = new Error('Credenciais inválidas');
    error.statusCode = 401;
    throw error;
  }

  const token = signToken(user);
  return { user: sanitizeUser(user), token };
};

const forgotPasswordUser = async ({ email }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return { email };
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetPasswordExpires = new Date(Date.now() + 3600000);

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetPasswordExpires;
  await user.save();

  return { email: user.email, resetToken };
};

const resetPasswordUser = async ({ token, password }) => {
  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    const error = new Error('Token de recuperação inválido ou expirado');
    error.statusCode = 400;
    throw error;
  }

  user.password = await hashPassword(password);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { user: sanitizeUser(user), token: signToken(user) };
};

module.exports = {
  registerUser,
  loginUser,
  forgotPasswordUser,
  resetPasswordUser,
  hashPassword,
  sanitizeUser,
};
