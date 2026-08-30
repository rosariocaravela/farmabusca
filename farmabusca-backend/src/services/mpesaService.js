const { RESERVATION_FEE_MZN } = require('../utils/paymentPolicy');

const requestMpesaPayment = async ({ phone, reference, amount = RESERVATION_FEE_MZN }) => {
  const mode = String(process.env.PAYMENT_PROVIDER_MODE || 'mock').toLowerCase();
  if (mode === 'mock') {
    return {
      providerTransactionId: `MOCK-${reference}`,
      providerStatus: 'PENDING',
      message: 'Pedido de teste pendente. Confirme o pagamento no simulador M-Pesa; nenhuma cobrança real foi feita.',
    };
  }

  const apiKey = process.env.MPESA_API_KEY;
  const publicKey = process.env.MPESA_PUBLIC_KEY;
  const serviceProviderCode = process.env.MPESA_SERVICE_PROVIDER_CODE;
  const configuredBaseUrl = String(process.env.MPESA_BASE_URL || '').trim();
  if (!apiKey || !publicKey || !serviceProviderCode || !configuredBaseUrl) throw new Error('Credenciais M-Pesa não configuradas no servidor');

  const baseUrl = /^https?:\/\//i.test(configuredBaseUrl) ? configuredBaseUrl : `https://${configuredBaseUrl}`;
  let endpoint;
  try {
    endpoint = new URL('/ipg/v1x/c2bPayment/singleStage/', `${baseUrl.replace(/\/$/, '')}/`).toString();
  } catch (error) {
    throw new Error('MPESA_BASE_URL inválida. Use uma URL como https://api.vm.co.mz:18352');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Origin: process.env.MPESA_ORIGIN || '*',
      publicKey,
    },
    body: JSON.stringify({
      transactionReference: reference,
      customerMsisdn: phone,
      amount,
      thirdPartyReference: reference,
      serviceProviderCode,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.output_ResponseCode !== 'INS-0') {
    throw new Error(data.output_ResponseDesc || 'O M-Pesa recusou o pedido de pagamento');
  }
  return {
    providerTransactionId: data.output_TransactionID || reference,
    providerStatus: 'PAID',
    message: data.output_ResponseDesc || 'Pagamento confirmado pelo M-Pesa.',
  };
};

module.exports = { requestMpesaPayment };
