const RESERVATION_FEE_MZN = 25;
const PLAN_PRICES_MZN = { essential: 99, premium: 199 };
const FORBIDDEN_PIN_FIELDS = new Set(['pin', 'mpesapin', 'mpesa_pin', 'walletpin', 'wallet_pin']);

const normalizeMozambiquePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.startsWith('258') ? digits.slice(3) : digits;
  if (!/^(84|85)\d{7}$/.test(local)) throw new Error('Introduza um número M-Pesa válido (84/85XXXXXXX)');
  return `258${local}`;
};

const assertNoPin = (payload = {}) => {
  const forbidden = Object.keys(payload).find((key) => FORBIDDEN_PIN_FIELDS.has(key.toLowerCase()));
  if (forbidden) throw new Error('O PIN deve ser introduzido apenas no pedido oficial do M-Pesa');
};

const createReservationReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FBR-${timestamp}-${random}`;
};

const createPlanReference = () => `FBP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

module.exports = { RESERVATION_FEE_MZN, PLAN_PRICES_MZN, assertNoPin, createReservationReference, createPlanReference, normalizeMozambiquePhone };
