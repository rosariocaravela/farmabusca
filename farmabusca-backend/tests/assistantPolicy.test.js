const test = require('node:test');
const assert = require('node:assert/strict');
const { isEmergencyRequest, isUnsafeMedicalRequest, sanitizeForGemini, validateAssistantIntent } = require('../src/utils/assistantPolicy');
const { callGemini, extractIntent, naturalizeVerifiedAnswer } = require('../src/services/geminiService');
const { composeAnswer } = require('../src/controllers/assistantController');

const validIntent = { intent: 'SEARCH_MEDICINE_NEARBY', medicineName: 'Amoxicilina', locationMode: 'CURRENT_LOCATION', textLocation: null, radiusKm: 3, minimumPrice: null, maximumPrice: null, onlyAvailable: true, sortBy: 'DISTANCE', needsClarification: false, clarificationQuestion: null };

test('valida intenção estruturada e rejeita valores fora do contrato', () => {
  assert.deepEqual(validateAssistantIntent(validIntent), validIntent);
  assert.throws(() => validateAssistantIntent({ ...validIntent, intent: 'INVENTAR_FARMACIA' }), /Intenção/);
  assert.throws(() => validateAssistantIntent({ ...validIntent, radiusKm: 7 }), /Raio/);
  assert.throws(() => validateAssistantIntent({ ...validIntent, minimumPrice: 300, maximumPrice: 100 }), /Intervalo/);
});

test('sanitiza email, telefone, token e credencial antes do Gemini', () => {
  const sanitized = sanitizeForGemini('Meu email eu@example.com telefone +258 84 123 4567 password=segredo eyJabc.def.ghi');
  assert.doesNotMatch(sanitized, /eu@example|841234567|segredo|eyJabc/);
  assert.match(sanitized, /removid/);
});

test('bloqueia pedidos clínicos e reconhece emergência localmente', () => {
  assert.equal(isUnsafeMedicalRequest('Qual medicamento devo tomar?'), true);
  assert.equal(isEmergencyRequest('Estou com falta de ar'), true);
  assert.equal(isUnsafeMedicalRequest('Onde encontro Paracetamol?'), false);
});

test('extrai intenção com Gemini mock sem utilizar chave real', async () => {
  const previous = { enabled: process.env.GEMINI_ENABLED, key: process.env.GEMINI_API_KEY };
  process.env.GEMINI_ENABLED = 'true'; process.env.GEMINI_API_KEY = 'fake-test-key';
  let sentBody;
  const fetchImpl = async (_url, options) => { sentBody = JSON.parse(options.body); return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(validIntent) }] } }] }) }; };
  try {
    const intent = await extractIntent('Procuro Amoxicilina 500 mg perto de mim', null, { fetchImpl });
    assert.equal(intent.medicineName, 'Amoxicilina');
    assert.doesNotMatch(JSON.stringify(sentBody), /email|telefone|password/);
  } finally { process.env.GEMINI_ENABLED = previous.enabled; process.env.GEMINI_API_KEY = previous.key; }
});

test('resposta factual usa somente resultados fornecidos e omite distância inexistente', () => {
  const result = { pharmacy: { name: 'Farmácia Fictícia' }, medicine: { price: 250, stockStatus: 'AVAILABLE' }, distanceMeters: null, distanceKm: null };
  const answer = composeAnswer(validIntent, [result]);
  assert.match(answer, /Farmácia Fictícia/); assert.match(answer, /250 MT/); assert.doesNotMatch(answer, /\bkm\b|\bm\b/);
  assert.doesNotMatch(composeAnswer(validIntent, []), /Farmácia Fictícia/);
});

test('trata indisponibilidade, limite 429, timeout e JSON inválido', async () => {
  const previous = { enabled: process.env.GEMINI_ENABLED, key: process.env.GEMINI_API_KEY };
  try {
    process.env.GEMINI_ENABLED = 'false'; process.env.GEMINI_API_KEY = '';
    await assert.rejects(() => callGemini('teste'), (error) => error.code === 'AI_UNAVAILABLE');
    process.env.GEMINI_ENABLED = 'true'; process.env.GEMINI_API_KEY = 'fake-test-key';
    await assert.rejects(() => callGemini('teste', { retries: 0, fetchImpl: async () => ({ ok: false, status: 429 }) }), (error) => error.code === 'AI_RATE_LIMIT');
    const hangingFetch = async (_url, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
    await assert.rejects(() => callGemini('teste', { retries: 0, timeoutMs: 5, fetchImpl: hangingFetch }), (error) => error.code === 'AI_TIMEOUT');
    const invalidFetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'não é JSON' }] } }] }) });
    await assert.rejects(() => extractIntent('teste', null, { fetchImpl: invalidFetch }), /JSON inválida/);
  } finally { process.env.GEMINI_ENABLED = previous.enabled; process.env.GEMINI_API_KEY = previous.key; }
});

test('naturalização não pode inventar resultados ou valores', async () => {
  const previous = { enabled: process.env.GEMINI_ENABLED, key: process.env.GEMINI_API_KEY };
  process.env.GEMINI_ENABLED = 'true'; process.env.GEMINI_API_KEY = 'fake-test-key';
  const results = [{ pharmacy: { name: 'Farmácia Fictícia' } }];
  try {
    const validFetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ answer: 'Encontrei a Farmácia Fictícia por 250 MT.' }) }] } }] }) });
    assert.equal(await naturalizeVerifiedAnswer('Farmácia Fictícia — 250 MT.', results, { fetchImpl: validFetch }), 'Encontrei a Farmácia Fictícia por 250 MT.');
    const inventedFetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ answer: 'Farmácia Fictícia — 250 MT e 99 km.' }) }] } }] }) });
    await assert.rejects(() => naturalizeVerifiedAnswer('Farmácia Fictícia — 250 MT.', results, { fetchImpl: inventedFetch }), /valores não verificados/);
  } finally { process.env.GEMINI_ENABLED = previous.enabled; process.env.GEMINI_API_KEY = previous.key; }
});
