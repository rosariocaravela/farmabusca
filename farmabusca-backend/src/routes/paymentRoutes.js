const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getPaymentStatus, initiatePayment, initiatePlanPayment } = require('../controllers/paymentController');

const router = express.Router();
router.post('/', authMiddleware, roleMiddleware('PATIENT'), initiatePayment);
router.post('/plans', authMiddleware, roleMiddleware('PATIENT'), initiatePlanPayment);
router.get('/:id', authMiddleware, roleMiddleware('PATIENT'), getPaymentStatus);
module.exports = router;
