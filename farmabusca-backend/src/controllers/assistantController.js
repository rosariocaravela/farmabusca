const { extractIntent, naturalizeVerifiedAnswer } = require('../services/geminiService');
const { queryAssistantResults } = require('../services/assistantSearchService');
const { MAX_MESSAGE_LENGTH, isEmergencyRequest, isUnsafeMedicalRequest, validateAssistantIntent } = require('../utils/assistantPolicy');
const { validateCoordinates } = require('../utils/geo');

const unavailableMessage = 'O assistente inteligente está temporariamente indisponível. Pode continuar através da pesquisa normal.';
const clinicalMessage = 'Não posso diagnosticar nem recomendar a alteração da medicação. Consulte um profissional de saúde. Posso ajudar a encontrar uma farmácia próxima.';
const emergencyMessage = 'Esta situação pode exigir assistência urgente. Procure imediatamente os serviços de emergência ou uma unidade sanitária. Não espere por uma resposta online.';

const formatDistance = (item) => item.distanceMeters == null ? null : item.distanceMeters < 1000 ? `${item.distanceMeters} m` : `${Number(item.distanceKm).toLocaleString('pt-MZ')} km`;
const composeAnswer = (intent, results) => {
  const label = intent.medicineName || 'o pedido';
  if (!results.length) {
    const area = intent.radiusKm ? ` num raio de ${intent.radiusKm} km` : intent.textLocation ? ` em ${intent.textLocation}` : '';
    return `Não encontrei ${label}${area} com os filtros indicados. Posso aumentar a distância, retirar o limite de preço ou incluir resultados esgotados.`;
  }
  const lines = results.map((item, index) => {
    const medicine = item.medicine;
    const parts = [item.pharmacy.name];
    const distance = formatDistance(item);
    if (distance) parts.push(distance);
    if (medicine?.price != null) parts.push(`${Number(medicine.price).toLocaleString('pt-MZ')} MT`);
    if (medicine) parts.push(medicine.stockStatus === 'OUT_OF_STOCK' ? 'indisponível' : 'disponível');
    return `${index + 1}. ${parts.join(' — ')}.`;
  });
  return `Encontrei ${results.length} ${results.length === 1 ? 'opção' : 'opções'} para ${label}:\n\n${lines.join('\n')}\n\nDeseja ver a mais próxima ou a mais barata?`;
};

const answerQuestion = async (req, res, next) => {
  try {
    const message = String(req.body.message ?? req.body.question ?? '').trim();
    if (message.length < 2) return res.status(400).json({ success: false, message: 'Escreva uma mensagem válida' });
    if (message.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ success: false, message: `A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres` });
    if (isEmergencyRequest(message)) return res.json({ success: true, data: { answer: emergencyMessage, intent: { intent: 'UNSUPPORTED_MEDICAL_REQUEST' }, results: [], safety: 'EMERGENCY' } });
    if (isUnsafeMedicalRequest(message)) return res.json({ success: true, data: { answer: clinicalMessage, intent: { intent: 'UNSUPPORTED_MEDICAL_REQUEST' }, results: [], safety: 'MEDICAL_BOUNDARY' } });

    let intent;
    try {
      intent = await extractIntent(message, req.body.context || null);
    } catch (error) {
      return res.status(503).json({ success: false, message: unavailableMessage, data: { answer: unavailableMessage, fallbackRoute: 'SearchList', reason: error.code || 'INVALID_AI_RESPONSE' } });
    }
    intent = validateAssistantIntent(intent);
    if (intent.intent === 'UNSUPPORTED_MEDICAL_REQUEST') return res.json({ success: true, data: { answer: clinicalMessage, intent, results: [], safety: 'MEDICAL_BOUNDARY' } });
    if (intent.intent === 'GREETING') return res.json({ success: true, data: { answer: 'Olá! Diga o nome de um medicamento ou peça uma farmácia próxima. Também pode indicar um bairro sem utilizar GPS.', intent, results: [] } });
    if (intent.needsClarification || intent.intent === 'CLARIFY_MEDICINE') return res.json({ success: true, data: { answer: intent.clarificationQuestion || 'Qual é o nome do medicamento que procura?', intent, results: [], action: 'CLARIFY' } });

    let coordinates = null;
    try { coordinates = validateCoordinates(req.body.location?.latitude, req.body.location?.longitude); } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    if (intent.locationMode === 'CURRENT_LOCATION' && !coordinates) {
      return res.json({ success: true, data: { answer: 'Para encontrar as farmácias mais próximas, posso utilizar a localização actual do seu dispositivo?', intent, results: [], action: 'REQUEST_LOCATION' } });
    }
    if (intent.locationMode === 'TEXT_LOCATION' && !intent.textLocation) {
      return res.json({ success: true, data: { answer: 'Indique o bairro, endereço ou ponto de referência onde pretende pesquisar.', intent, results: [], action: 'REQUEST_TEXT_LOCATION' } });
    }

    const results = await queryAssistantResults(intent, coordinates);
    const verifiedAnswer = composeAnswer(intent, results);
    let answer = verifiedAnswer;
    try { answer = await naturalizeVerifiedAnswer(verifiedAnswer, results, { timeoutMs: 8000, retries: 0 }); } catch { /* deterministic answer remains available */ }
    return res.json({ success: true, message: 'Pesquisa do assistente concluída', data: { answer, intent, results, action: 'SHOW_RESULTS' } });
  } catch (error) { return next(error); }
};

module.exports = { answerQuestion, composeAnswer, unavailableMessage };
