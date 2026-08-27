const { sanitizeForGemini, validateAssistantIntent } = require('../utils/assistantPolicy');

const DEFAULT_TIMEOUT_MS = 30000;
const systemInstruction = `Você interpreta pedidos de pesquisa do FarmaBusca. Responda APENAS com JSON. Não diagnostique, prescreva, recomende tratamento nem invente dados. Extraia uma das intenções permitidas e use null quando a informação não existir. Use o contexto estruturado anterior para resolver frases de continuação como "mostre a mais barata", mantendo medicamento e filtros anteriores que a nova mensagem não alterar. Para pedidos clínicos use UNSUPPORTED_MEDICAL_REQUEST. Para proximidade sem bairro use CURRENT_LOCATION. Raio permitido: 1, 3, 5 ou 10 km.`;

const responseSchema = {
  type: 'OBJECT', required: ['intent', 'locationMode', 'onlyAvailable', 'sortBy', 'needsClarification'],
  properties: {
    intent: { type: 'STRING', enum: ['SEARCH_MEDICINE_NEARBY', 'SEARCH_PHARMACY_NEARBY', 'SEARCH_BY_PRICE', 'REQUEST_CURRENT_LOCATION', 'USE_TEXT_LOCATION', 'CLARIFY_MEDICINE', 'GREETING', 'UNSUPPORTED_MEDICAL_REQUEST'] },
    medicineName: { type: 'STRING', nullable: true },
    locationMode: { type: 'STRING', enum: ['CURRENT_LOCATION', 'TEXT_LOCATION', 'NONE'] }, textLocation: { type: 'STRING', nullable: true },
    radiusKm: { type: 'NUMBER', nullable: true }, minimumPrice: { type: 'NUMBER', nullable: true }, maximumPrice: { type: 'NUMBER', nullable: true },
    onlyAvailable: { type: 'BOOLEAN' }, sortBy: { type: 'STRING', enum: ['DISTANCE', 'PRICE_ASC', 'PRICE_DESC'] },
    needsClarification: { type: 'BOOLEAN' }, clarificationQuestion: { type: 'STRING', nullable: true },
  },
};

const geminiEnabled = () => String(process.env.GEMINI_ENABLED || 'false').toLowerCase() === 'true' && Boolean(process.env.GEMINI_API_KEY);

const parseJsonResponse = (raw, errorMessage) => {
  const cleaned = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* handled below */ }
    }
    throw new Error(errorMessage);
  }
};

const callGemini = async (prompt, { fetchImpl = fetch, timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS, retries = 1, json = true, schema = responseSchema, instruction = systemInstruction } = {}) => {
  if (!geminiEnabled()) { const error = new Error('Gemini disabled'); error.code = 'AI_UNAVAILABLE'; throw error; }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const model = encodeURIComponent(process.env.GEMINI_MODEL || 'gemini-3.5-flash');
    const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: instruction }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 500, thinkingConfig: { thinkingLevel: 'LOW' }, ...(json ? { responseMimeType: 'application/json', responseSchema: schema } : {}) } }),
    });
    if (!response.ok) {
      if ((response.status === 429 || response.status >= 500) && retries > 0) return callGemini(prompt, { fetchImpl, timeoutMs, retries: retries - 1, json, schema, instruction });
      const error = new Error(`Gemini unavailable (${response.status})`); error.code = response.status === 429 ? 'AI_RATE_LIMIT' : 'AI_UNAVAILABLE'; throw error;
    }
    const payload = await response.json();
    const textParts = (payload.candidates?.[0]?.content?.parts || [])
      .filter((part) => typeof part.text === 'string' && !part.thought)
      .map((part) => part.text.trim())
      .filter(Boolean);
    return textParts.at(-1) || '';
  } catch (error) {
    if (error.name === 'AbortError') { const timeout = new Error('Gemini timeout'); timeout.code = 'AI_TIMEOUT'; throw timeout; }
    throw error;
  } finally { clearTimeout(timer); }
};

const extractIntent = async (message, context = null, options = {}) => {
  const safeMessage = sanitizeForGemini(message);
  const safeContext = context ? validateAssistantIntent(context) : null;
  const raw = await callGemini(`Mensagem actual: ${JSON.stringify(safeMessage)}\nContexto estruturado anterior: ${JSON.stringify(safeContext)}`, { ...options, json: true });
  const parsed = parseJsonResponse(raw, 'Resposta JSON inválida do Gemini');
  return validateAssistantIntent(parsed);
};

const naturalizeVerifiedAnswer = async (verifiedAnswer, results, options = {}) => {
  const schema = { type: 'OBJECT', required: ['answer'], properties: { answer: { type: 'STRING' } } };
  const instruction = 'Reescreva em português de Moçambique, de forma breve e cordial. Preserve rigorosamente todos os nomes, valores, estados e distâncias fornecidos. Não acrescente farmácias, preços, stock, horários, distâncias, aconselhamento clínico ou outros factos. Responda apenas com JSON.';
  const raw = await callGemini(`Texto factual verificado pelo backend:\n${verifiedAnswer}`, { ...options, json: true, schema, instruction });
  const parsed = parseJsonResponse(raw, 'Resposta natural inválida do Gemini');
  const answer = String(parsed.answer || '').trim();
  if (!answer || answer.length > 1500) throw new Error('Resposta natural inválida do Gemini');
  const requiredNames = results.map((item) => item.pharmacy?.name).filter(Boolean);
  if (requiredNames.some((name) => !answer.includes(name))) throw new Error('Resposta omitiu resultados verificados');
  const allowedNumbers = new Set((verifiedAnswer.match(/\d+(?:[.,]\d+)?/g) || []).map((value) => value.replace(',', '.')));
  const generatedNumbers = (answer.match(/\d+(?:[.,]\d+)?/g) || []).map((value) => value.replace(',', '.'));
  if (generatedNumbers.some((value) => !allowedNumbers.has(value))) throw new Error('Resposta acrescentou valores não verificados');
  if (/abert[ao]|fechad[ao]|receitad|recomendad|deve tomar|tratamento/i.test(answer) && !/abert[ao]|fechad[ao]/i.test(verifiedAnswer)) throw new Error('Resposta acrescentou afirmação não verificada');
  return answer;
};

module.exports = { callGemini, extractIntent, geminiEnabled, naturalizeVerifiedAnswer, parseJsonResponse, responseSchema };
