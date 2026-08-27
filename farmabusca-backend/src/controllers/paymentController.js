const { Medicine, Payment, Pharmacy, User } = require('../models');
const { requestMpesaPayment } = require('../services/mpesaService');
const { RESERVATION_FEE_MZN, PLAN_PRICES_MZN, assertNoPin, createReservationReference, createPlanReference, normalizeMozambiquePhone } = require('../utils/paymentPolicy');

const publicPayment = (payment) => ({
  id: payment.id,
  medicineId: payment.medicineId,
  plan: payment.plan,
  provider: payment.provider,
  amount: Number(payment.amount),
  reference: payment.reference,
  status: payment.status,
  isTest: String(payment.providerTransactionId || '').startsWith('MOCK-'),
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const initiatePayment = async (req, res, next) => {
  let payment;
  try {
    assertNoPin(req.body);
    const phone = normalizeMozambiquePhone(req.body.phone);
    const requestId = String(req.body.requestId || '');
    if (!/^[A-Za-z0-9-]{12,80}$/.test(requestId)) {
      return res.status(400).json({ success: false, message: 'Identificador do pedido inválido' });
    }
    const existing = await Payment.findOne({ where: { userId: req.user.id, requestId } });
    if (existing) {
      return res.json({ success: true, message: 'Este pedido já foi recebido', data: publicPayment(existing) });
    }
    const medicine = await Medicine.findOne({ where: { id: req.body.medicineId }, include: [{ model: Pharmacy, required: true }] });
    if (!medicine || medicine.stockStatus === 'OUT_OF_STOCK' || medicine.quantity < 1) {
      return res.status(400).json({ success: false, message: 'Este medicamento não está disponível para reserva' });
    }
    if (!medicine.Pharmacy.approved || medicine.Pharmacy.suspended) {
      return res.status(400).json({ success: false, message: 'Esta farmácia não está disponível para reservas' });
    }

    payment = await Payment.create({
      userId: req.user.id,
      medicineId: medicine.id,
      provider: 'MPESA',
      amount: RESERVATION_FEE_MZN,
      phone,
      requestId,
      reference: createReservationReference(),
      status: 'PENDING',
    });
    const providerResult = await requestMpesaPayment({ phone, reference: payment.reference });
    payment.status = providerResult.providerStatus;
    payment.providerTransactionId = providerResult.providerTransactionId;
    await payment.save();
    return res.status(201).json({ success: true, message: providerResult.message, data: publicPayment(payment) });
  } catch (error) {
    if (payment) {
      payment.status = 'FAILED';
      payment.failureReason = String(error.message || 'Falha no pagamento').slice(0, 255);
      await payment.save().catch(() => {});
    }
    if (/PIN|número M-Pesa|Credenciais M-Pesa/.test(error.message || '')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const initiatePlanPayment = async (req, res, next) => {
  let payment;
  try {
    assertNoPin(req.body);
    const plan = String(req.body.plan || '').toLowerCase();
    const amount = PLAN_PRICES_MZN[plan];
    const phone = normalizeMozambiquePhone(req.body.phone);
    const requestId = String(req.body.requestId || '');
    if (!amount || !/^[A-Za-z0-9-]{12,80}$/.test(requestId)) {
      return res.status(400).json({ success: false, message: 'Plano ou identificador do pedido inválido' });
    }
    const existing = await Payment.findOne({ where: { userId: req.user.id, requestId } });
    if (existing) return res.json({ success: true, message: 'Este pedido já foi recebido', data: publicPayment(existing) });

    payment = await Payment.create({ userId: req.user.id, plan, provider: 'MPESA', amount, phone, requestId, reference: createPlanReference(), status: 'PENDING' });
    const providerResult = await requestMpesaPayment({ phone, reference: payment.reference, amount });
    payment.status = providerResult.providerStatus;
    payment.providerTransactionId = providerResult.providerTransactionId;
    await payment.save();
    if (payment.status === 'PAID') {
      await User.update({ subscriptionPlan: plan, subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, { where: { id: req.user.id } });
    }
    return res.status(201).json({ success: true, message: providerResult.message, data: publicPayment(payment) });
  } catch (error) {
    if (payment) {
      payment.status = 'FAILED';
      payment.failureReason = String(error.message || 'Falha no pagamento').slice(0, 255);
      await payment.save().catch(() => {});
    }
    if (/PIN|número M-Pesa|Credenciais M-Pesa/.test(error.message || '')) return res.status(400).json({ success: false, message: error.message });
    return next(error);
  }
};

const getPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!payment) return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
    return res.json({ success: true, message: 'Estado do pagamento', data: publicPayment(payment) });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getPaymentStatus, initiatePayment, initiatePlanPayment };
