const express = require('express');
const { register, login, forgotPassword, resetPassword, profile } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/profile', authMiddleware, profile);

module.exports = router;
