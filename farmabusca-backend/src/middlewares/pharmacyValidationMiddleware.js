const { body, validationResult } = require('express-validator');
const { validateCoordinates } = require('../utils/geo');

const fields = [
  body('name').optional().trim().isLength({ min: 2, max: 160 }).withMessage('Nome da farmácia inválido'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 3000 }).withMessage('Descrição demasiado longa'),
  body('address').optional().trim().isLength({ min: 3, max: 255 }).withMessage('Endereço inválido'),
  body('phone').optional().trim().isLength({ min: 8, max: 30 }).withMessage('Contacto inválido'),
  body('whatsapp').optional({ nullable: true }).trim().isLength({ max: 30 }).withMessage('WhatsApp inválido'),
  body('openingHours').optional({ nullable: true }).trim().isLength({ max: 120 }).withMessage('Horário inválido'),
  body('province').optional({ nullable: true }).trim().isLength({ max: 120 }).withMessage('Província inválida'),
  body('district').optional({ nullable: true }).trim().isLength({ max: 120 }).withMessage('Distrito inválido'),
  body('neighborhood').optional({ nullable: true }).trim().isLength({ min: 2, max: 160 }).withMessage('Bairro inválido'),
  body('location').optional({ nullable: true }).trim().isLength({ min: 3, max: 255 }).withMessage('Ponto de referência inválido'),
  body().custom((payload) => {
    validateCoordinates(payload.latitude, payload.longitude);
    return true;
  }),
];

const handle = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Verifique os dados da farmácia', errors: errors.array() });
  return next();
};

const validateCreatePharmacy = [
  body('name').trim().isLength({ min: 2, max: 160 }).withMessage('Nome da farmácia é obrigatório'),
  body('address').trim().isLength({ min: 3, max: 255 }).withMessage('Endereço é obrigatório'),
  ...fields.slice(1),
  handle,
];
const validateUpdatePharmacy = [...fields, handle];

module.exports = { validateCreatePharmacy, validateUpdatePharmacy };
