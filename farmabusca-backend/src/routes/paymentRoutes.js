const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getPaymentStatus, initiatePayment } = require('../controllers/paymentController');

const router = express.Router();
router.post('/', authMiddleware, roleMiddleware('PATIENT'), initiatePayment);
router.get('/:id', authMiddleware, roleMiddleware('PATIENT'), getPaymentStatus);
module.exports = router;
