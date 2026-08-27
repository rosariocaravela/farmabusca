const MAX_MESSAGE_LENGTH = 500;
const ALLOWED_INTENTS = new Set([
  'SEARCH_MEDICINE_NEARBY', 'SEARCH_PHARMACY_NEARBY', 'SEARCH_BY_PRICE',
  'REQUEST_CURRENT_LOCATION', 'USE_TEXT_LOCATION', 'CLARIFY_MEDICINE',
  'GREETING', 'UNSUPPORTED_MEDICAL_REQUEST',
]);
const ALLOWED_LOCATION_MODES = new Set(['CURRENT_LOCATION', 'TEXT_LOCATION', 'NONE']);
const ALLOWED_SORTS = new Set(['DISTANCE', 'PRICE_ASC', 'PRICE_DESC']);

const cleanText = (value, max = 160) => {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, max) : null;
};

const sanitizeForGemini = (value) => {
  let text = cleanText(value, MAX_MESSAGE_LENGTH) || '';
  text = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email removido]')
    .replace(/(?:\+?258[ -]?)?8[2-7][0-9][ -]?[0-9]{3}[ -]?[0-9]{3}/g, '[telefone removido]')
    .replace(/\b(?:bearer\s+)?eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gi, '[token removido]')
    .replace(/\b(?:senha|password|palavra-passe)\s*[:=]\s*\S+/gi, '[credencial removida]');
  return text;
};

const nullableNumber = (value, name) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${name} inválido`);
  return number;
};

const validateAssistantIntent = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Resposta estruturada inválida');
  if (!ALLOWED_INTENTS.has(raw.intent)) throw new Error('Intenção inválida');
  const locationMode = raw.locationMode || 'NONE';
  const sortBy = raw.sortBy || 'DISTANCE';
  if (!ALLOWED_LOCATION_MODES.has(locationMode) || !ALLOWED_SORTS.has(sortBy)) throw new Error('Parâmetros de pesquisa inválidos');
  const radiusKm = nullableNumber(raw.radiusKm, 'Raio');
  if (radiusKm !== null && ![1, 3, 5, 10].includes(radiusKm)) throw new Error('Raio inválido');
  const minimumPrice = nullableNumber(raw.minimumPrice, 'Preço mínimo');
  const maximumPrice = nullableNumber(raw.maximumPrice, 'Preço máximo');
  if (minimumPrice !== null && maximumPrice !== null && minimumPrice > maximumPrice) throw new Error('Intervalo de preço inválido');
  const needsClarification = Boolean(raw.needsClarification);
  const result = {
    intent: raw.intent,
    medicineName: cleanText(raw.medicineName, 120),
    locationMode, textLocation: cleanText(raw.textLocation, 180), radiusKm, minimumPrice, maximumPrice,
    onlyAvailable: raw.onlyAvailable !== false, sortBy, needsClarification,
    clarificationQuestion: cleanText(raw.clarificationQuestion, 240),
  };
  if (needsClarification && !result.clarificationQuestion) throw new Error('Pergunta de clarificação ausente');
  return result;
};

const isEmergencyRequest = (message) => /falta de ar|desmai|convuls|hemorrag|overdose|dor (?:forte|intensa)|emerg[eê]ncia/i.test(message);
const isUnsafeMedicalRequest = (message) => /diagn[oó]stic|o que (?:tenho|é isto)|qual (?:rem[eé]dio|medicamento) (?:devo|posso)|aumentar? (?:a )?dose|diminuir? (?:a )?dose|como (?:devo )?tomar|prescrev|tratamento/i.test(message);

module.exports = { ALLOWED_INTENTS, MAX_MESSAGE_LENGTH, isEmergencyRequest, isUnsafeMedicalRequest, sanitizeForGemini, validateAssistantIntent };
