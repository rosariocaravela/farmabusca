const { registerUser, loginUser, forgotPasswordUser, resetPasswordUser } = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ success: true, message: 'Conta criada com sucesso', data: user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.json({ success: true, message: 'Login realizado', data: result });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await forgotPasswordUser(req.body);
    res.json({ success: true, message: 'Se o email existir, você receberá instruções para recuperar a senha', data: result });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await resetPasswordUser(req.body);
    res.json({ success: true, message: 'Senha redefinida com sucesso', data: result });
  } catch (error) {
    next(error);
  }
};

const profile = async (req, res) => {
  const user = req.user.toJSON ? req.user.toJSON() : req.user;
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  res.json({ success: true, message: 'Perfil carregado', data: user });
};

module.exports = { register, login, forgotPassword, resetPassword, profile };
