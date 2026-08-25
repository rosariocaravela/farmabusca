const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { answerQuestion } = require('../controllers/assistantController');

const router = express.Router();

router.post('/', authMiddleware, answerQuestion);

module.exports = router;
