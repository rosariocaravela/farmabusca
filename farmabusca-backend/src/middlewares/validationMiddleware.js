const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Verifique os dados enviados',
      errors: errors.array(),
    });
  }
  next();
};

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório')
    .isLength({ max: 120 }).withMessage('Nome demasiado longo'),
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Telefone é obrigatório')
    .isLength({ max: 30 }).withMessage('Telefone inválido'),
  body('role').optional()
    .custom((value) => ['PATIENT', 'PHARMACY'].includes(String(value).toUpperCase()))
    .withMessage('Tipo de conta inválido'),
  body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres'),
  body('confirmPassword').notEmpty().withMessage('Confirmação da senha é obrigatória')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('As senhas não coincidem'),
  handleValidationErrors,
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
  handleValidationErrors,
];

const validateForgotPassword = [
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  handleValidationErrors,
];

const validateResetPassword = [
  body('token').trim().notEmpty().withMessage('Código de recuperação é obrigatório'),
  body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres'),
  body('confirmPassword').notEmpty().withMessage('Confirmação da senha é obrigatória')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('As senhas não coincidem'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
