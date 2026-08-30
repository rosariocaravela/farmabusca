const test = require('node:test');
const assert = require('node:assert/strict');
const { RESERVATION_FEE_MZN, assertNoPin, createReservationReference, normalizeMozambiquePhone } = require('../src/utils/paymentPolicy');

test('a taxa de reserva é sempre 25 MT', () => assert.equal(RESERVATION_FEE_MZN, 25));
test('normaliza números M-Pesa de Moçambique', () => {
  assert.equal(normalizeMozambiquePhone('84 123 4567'), '258841234567');
  assert.equal(normalizeMozambiquePhone('+258 85 123 4567'), '258851234567');
});
test('recusa número que não pertence ao formato M-Pesa', () => {
  assert.throws(() => normalizeMozambiquePhone('82 123 4567'), /número M-Pesa válido/);
});
test('recusa qualquer tentativa de enviar o PIN para o FarmaBusca', () => {
  assert.throws(() => assertNoPin({ phone: '841234567', pin: '1234' }), /pedido oficial do M-Pesa/);
  assert.throws(() => assertNoPin({ mpesa_pin: '1234' }), /pedido oficial do M-Pesa/);
});
test('aceita pedido que contém apenas o número e medicamento', () => {
  assert.doesNotThrow(() => assertNoPin({ phone: '841234567', medicineId: 'abc' }));
});
test('gera referências diferentes para reservas', () => {
  const first = createReservationReference();
  const second = createReservationReference();
  assert.match(first, /^FBR-/);
  assert.notEqual(first, second);
});
