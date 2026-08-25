const { askAssistant, MAX_QUESTION_LENGTH } = require('../services/aiService');

const answerQuestion = async (req, res, next) => {
  try {
    const question = String(req.body.question || '').trim();
    const medicineId = req.body.medicineId || null;
    if (question.length < 3) {
      return res.status(400).json({ success: false, message: 'Escreva uma pergunta válida' });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({ success: false, message: `A pergunta deve ter no máximo ${MAX_QUESTION_LENGTH} caracteres` });
    }
    const answer = await askAssistant(question, medicineId);
    return res.json({ success: true, message: 'Resposta gerada', data: { answer } });
  } catch (error) {
    return next(error);
  }
};

module.exports = { answerQuestion };
