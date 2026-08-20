const test = require('node:test');
const assert = require('node:assert/strict');
const { requestMpesaPayment } = require('../src/services/mpesaService');

test('modo mock não contacta nem solicita PIN ao cliente', async () => {
  const previousMode = process.env.PAYMENT_PROVIDER_MODE;
  process.env.PAYMENT_PROVIDER_MODE = 'mock';
  try {
    const result = await requestMpesaPayment({ phone: '258841234567', reference: 'FBR-TESTE' });
    assert.equal(result.providerStatus, 'PENDING');
    assert.equal(result.providerTransactionId, 'MOCK-FBR-TESTE');
    assert.doesNotMatch(JSON.stringify(result), /pin/i);
  } finally {
    if (previousMode === undefined) delete process.env.PAYMENT_PROVIDER_MODE;
    else process.env.PAYMENT_PROVIDER_MODE = previousMode;
  }
});

test('modo M-Pesa real falha de forma segura sem credenciais', async () => {
  const previousMode = process.env.PAYMENT_PROVIDER_MODE;
  process.env.PAYMENT_PROVIDER_MODE = 'mpesa';
  const keys = ['MPESA_API_KEY', 'MPESA_PUBLIC_KEY', 'MPESA_SERVICE_PROVIDER_CODE', 'MPESA_BASE_URL'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  keys.forEach((key) => delete process.env[key]);
  try {
    await assert.rejects(
      requestMpesaPayment({ phone: '258841234567', reference: 'FBR-TESTE' }),
      /Credenciais M-Pesa não configuradas/
    );
  } finally {
    if (previousMode === undefined) delete process.env.PAYMENT_PROVIDER_MODE;
    else process.env.PAYMENT_PROVIDER_MODE = previousMode;
    keys.forEach((key) => {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    });
  }
});

test('pedido C2B envia 25 MT e nunca envia PIN ao M-Pesa', async () => {
  const previousFetch = global.fetch;
  const keys = ['PAYMENT_PROVIDER_MODE', 'MPESA_API_KEY', 'MPESA_PUBLIC_KEY', 'MPESA_SERVICE_PROVIDER_CODE', 'MPESA_BASE_URL'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    PAYMENT_PROVIDER_MODE: 'mpesa',
    MPESA_API_KEY: 'test-api-key',
    MPESA_PUBLIC_KEY: 'test-public-key',
    MPESA_SERVICE_PROVIDER_CODE: '123456',
    MPESA_BASE_URL: 'https://sandbox.example',
  });
  let sent;
  global.fetch = async (url, options) => {
    sent = { url, options };
    return {
      ok: true,
      json: async () => ({ output_ResponseCode: 'INS-0', output_TransactionID: 'TX-1' }),
    };
  };

  try {
    const result = await requestMpesaPayment({ phone: '258841234567', reference: 'FBR-TESTE' });
    const body = JSON.parse(sent.options.body);
    assert.equal(sent.url, 'https://sandbox.example/ipg/v1x/c2bPayment/singleStage/');
    assert.equal(body.amount, 25);
    assert.equal(body.customerMsisdn, '258841234567');
    assert.equal(result.providerStatus, 'PAID');
    assert.doesNotMatch(JSON.stringify(body), /pin/i);
  } finally {
    global.fetch = previousFetch;
    keys.forEach((key) => {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    });
  }
});
