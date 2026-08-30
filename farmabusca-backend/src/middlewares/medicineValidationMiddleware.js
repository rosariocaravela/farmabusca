const { body, validationResult } = require('express-validator');

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Verifique os dados do medicamento', errors: errors.array() });
  }
  return next();
};

const common = [
  body('name').optional().trim().isLength({ min: 2, max: 160 }).withMessage('Nome deve ter entre 2 e 160 caracteres'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Preço deve ser um número igual ou superior a zero'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantidade deve ser um número inteiro igual ou superior a zero'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock deve ser um número inteiro igual ou superior a zero'),
  body('stockStatus').optional().isIn(['AVAILABLE', 'OUT_OF_STOCK']).withMessage('Estado do stock inválido'),
  body('category').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Categoria inválida'),
  body('categoryId').optional().isUUID().withMessage('Identificador da categoria inválido'),
];

const validateCreateMedicine = [
  body('name').trim().isLength({ min: 2, max: 160 }).withMessage('Nome é obrigatório'),
  body('price').isFloat({ min: 0 }).withMessage('Preço inválido'),
  body().custom((payload) => Boolean(payload.categoryId || String(payload.category || '').trim())).withMessage('Categoria é obrigatória'),
  ...common.slice(1),
  handleErrors,
];

const validateUpdateMedicine = [...common, handleErrors];

module.exports = { validateCreateMedicine, validateUpdateMedicine };
