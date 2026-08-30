const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { answerQuestion } = require('../controllers/assistantController');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

const assistantLimiter = require('express-rate-limit').rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.ASSISTANT_RATE_LIMIT) || 10,
  standardHeaders: 'draft-7', legacyHeaders: false,
  message: { success: false, message: 'Muitas mensagens ao assistente. Aguarde um minuto e tente novamente.' },
});

router.post('/', assistantLimiter, authMiddleware, roleMiddleware('PATIENT'), answerQuestion);

module.exports = router;
