const { RESERVATION_FEE_MZN } = require('../utils/paymentPolicy');

const requestMpesaPayment = async ({ phone, reference }) => {
  const mode = String(process.env.PAYMENT_PROVIDER_MODE || 'mock').toLowerCase();
  if (mode === 'mock') {
    return {
      providerTransactionId: `MOCK-${reference}`,
      providerStatus: 'PENDING',
      message: 'Pedido de teste enviado. Confirme o pagamento no simulador M-Pesa.',
    };
  }

  const apiKey = process.env.MPESA_API_KEY;
  const publicKey = process.env.MPESA_PUBLIC_KEY;
  const serviceProviderCode = process.env.MPESA_SERVICE_PROVIDER_CODE;
  const baseUrl = process.env.MPESA_BASE_URL;
  if (!apiKey || !publicKey || !serviceProviderCode || !baseUrl) throw new Error('Credenciais M-Pesa não configuradas no servidor');

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/ipg/v1x/c2bPayment/singleStage/`, {
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
      amount: RESERVATION_FEE_MZN,
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
