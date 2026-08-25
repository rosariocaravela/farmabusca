const { Medicine, Category, Pharmacy } = require('../models');

const MAX_QUESTION_LENGTH = 500;

const getMedicineContext = async (medicineId) => {
  if (!medicineId) return null;
  const medicine = await Medicine.findOne({
    where: { id: medicineId },
    include: [Category, { model: Pharmacy, where: { approved: true, suspended: false }, required: true }],
  });
  if (!medicine) return null;
  return {
    name: medicine.name,
    description: medicine.description,
    price: medicine.price,
    stockStatus: medicine.stockStatus,
    category: medicine.Category?.name,
  };
};

const findMedicineInQuestion = async (question) => {
  const medicines = await Medicine.findAll({
    where: { stockStatus: ['AVAILABLE', 'LOW_STOCK'] },
    include: [Category, { model: Pharmacy, where: { approved: true, suspended: false }, required: true }],
  });
  const normalizedQuestion = question.toLowerCase();
  const medicine = medicines.find((item) => normalizedQuestion.includes(String(item.name).toLowerCase()));
  if (!medicine) return null;
  return {
    name: medicine.name,
    description: medicine.description,
    price: medicine.price,
    stockStatus: medicine.stockStatus,
    category: medicine.Category?.name,
    pharmacy: medicine.Pharmacy?.name,
    address: medicine.Pharmacy?.address || medicine.Pharmacy?.location,
  };
};

const localAnswer = (question, medicine) => {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes('emergência') || lowerQuestion.includes('emergencia') || lowerQuestion.includes('falta de ar') || lowerQuestion.includes('desmaio')) {
    return 'Se houver falta de ar, desmaio, convulsão, dor intensa ou uma reação grave, procure atendimento de emergência imediatamente. Não espere uma resposta online.';
  }
  if (medicine) {
    if (lowerQuestion.includes('onde') || lowerQuestion.includes('encontro') || lowerQuestion.includes('farmácia') || lowerQuestion.includes('farmacia')) {
      return `${medicine.name} está disponível na ${medicine.pharmacy || 'farmácia cadastrada'}${medicine.address ? `, em ${medicine.address}` : ''}. Confirme a disponibilidade antes de se deslocar.`;
    }
    if (lowerQuestion.includes('preço') || lowerQuestion.includes('custa')) {
      return `${medicine.name} está anunciado por ${Number(medicine.price).toLocaleString('pt-MZ')} MT. Confirme o preço e a disponibilidade com a farmácia antes de sair.`;
    }
    if (lowerQuestion.includes('dispon') || lowerQuestion.includes('stock')) {
      const status = medicine.stockStatus === 'LOW_STOCK' ? 'com poucas unidades' : 'disponível';
      return `${medicine.name} aparece ${status} no sistema. A disponibilidade pode mudar, por isso confirme com a farmácia.`;
    }
    if (lowerQuestion.includes('efeito') || lowerQuestion.includes('reação') || lowerQuestion.includes('reacao')) {
      return `Os efeitos de ${medicine.name} dependem da pessoa e da forma de utilização. Consulte a bula ou um farmacêutico, especialmente se os sintomas forem intensos ou novos.`;
    }
    if (lowerQuestion.includes('dose') || lowerQuestion.includes('tomar') || lowerQuestion.includes('idade')) {
      return `Não posso indicar uma dose de ${medicine.name} sem conhecer o seu estado de saúde e a orientação clínica. Confirme a dose com um médico ou farmacêutico.`;
    }
    if (lowerQuestion.includes('serve') || lowerQuestion.includes('utiliza') || lowerQuestion.includes('uso')) {
      return `${medicine.name} está na categoria ${medicine.category || 'não informada'}${medicine.description ? ` e é descrito como: ${medicine.description}` : '.'} A indicação correta deve ser confirmada com um profissional.`;
    }
    return `Encontrei ${medicine.name}${medicine.description ? `: ${medicine.description}` : '.'} Posso ajudar a localizar o medicamento e comparar farmácias, mas confirme indicações, dose e contraindicações com um profissional de saúde.`;
  }
  if (lowerQuestion.includes('farmácia') || lowerQuestion.includes('farmacia')) {
    return 'Posso ajudar a encontrar farmácias e comparar a disponibilidade de medicamentos. Diga o nome do medicamento ou abra a pesquisa.';
  }
  if (lowerQuestion.includes('serve') || lowerQuestion.includes('utiliza') || lowerQuestion.includes('uso')) {
    return 'Diga o nome do medicamento para eu consultar as informações disponíveis. Não indique doses ou tratamentos sem orientação de um profissional de saúde.';
  }
  if (lowerQuestion.includes('preço') || lowerQuestion.includes('custa') || lowerQuestion.includes('valor')) {
    return 'Para consultar o preço, pesquise o nome do medicamento. Os valores podem variar entre farmácias e devem ser confirmados antes da compra.';
  }
  if (lowerQuestion.includes('paracetamol') || lowerQuestion.includes('amoxicilina') || lowerQuestion.includes('vitamina')) {
    return `Encontrei a sua pesquisa por “${question.trim()}”. Abra a área Pesquisar para comparar medicamentos, preços e disponibilidade nas farmácias.`;
  }
  return 'Posso ajudar a pesquisar medicamentos, consultar disponibilidade e comparar preços. Para diagnóstico, dose ou tratamento, fale com um médico ou farmacêutico.';
};

const askOpenAI = async (question, medicine) => {
  if (!process.env.OPENAI_API_KEY) return null;
  const context = medicine ? `\nDados públicos do medicamento:\n${JSON.stringify(medicine)}` : '';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 350,
      messages: [
        { role: 'system', content: 'Responda em português de Moçambique, de forma breve e clara. Dê apenas informação geral de saúde. Nunca diagnostique, prescreva doses ou substitua médico/farmacêutico. Em sinais de emergência, recomende procurar atendimento imediato.' },
        { role: 'user', content: `${question}${context}` },
      ],
    }),
  });
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
};

const askAssistant = async (question, medicineId) => {
  const medicine = await getMedicineContext(medicineId) || await findMedicineInQuestion(question);
  try {
    return (await askOpenAI(question, medicine)) || localAnswer(question, medicine);
  } catch (error) {
    console.warn('AI provider unavailable, using local assistant:', error.message);
    return localAnswer(question, medicine);
  }
};

module.exports = { askAssistant, MAX_QUESTION_LENGTH };
