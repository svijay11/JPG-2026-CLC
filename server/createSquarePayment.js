import { randomUUID } from 'crypto';
import { SquareClient, SquareEnvironment } from 'square';

function getSquareClient(env = process.env) {
  const token = env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    const err = new Error('Missing SQUARE_ACCESS_TOKEN on the server.');
    err.statusCode = 500;
    throw err;
  }

  const isProd = String(env.SQUARE_ENVIRONMENT || 'sandbox').toLowerCase() === 'production';
  return new SquareClient({
    token,
    environment: isProd ? SquareEnvironment.Production : SquareEnvironment.Sandbox
  });
}

/**
 * Charge a Square payment token (from Web Payments SDK) for the order total.
 */
export async function createSquarePayment(payload = {}, env = process.env) {
  const {
    sourceId,
    amountCents,
    idempotencyKey,
    orderId,
    buyerName,
    buyerEmail,
    note
  } = payload;

  if (!sourceId || typeof sourceId !== 'string') {
    const err = new Error('Missing Square payment source token.');
    err.statusCode = 400;
    throw err;
  }

  const amount = Number(amountCents);
  if (!Number.isInteger(amount) || amount < 1) {
    const err = new Error('Invalid payment amount.');
    err.statusCode = 400;
    throw err;
  }

  const locationId = env.SQUARE_LOCATION_ID;
  if (!locationId) {
    const err = new Error('Missing SQUARE_LOCATION_ID on the server.');
    err.statusCode = 500;
    throw err;
  }

  const client = getSquareClient(env);
  let result;
  try {
    result = await client.payments.create({
      sourceId,
      idempotencyKey: idempotencyKey || randomUUID(),
      locationId,
      amountMoney: {
        amount: BigInt(amount),
        currency: 'USD'
      },
      autocomplete: true,
      referenceId: orderId ? String(orderId).slice(0, 40) : undefined,
      note: note ? String(note).slice(0, 500) : undefined,
      buyerEmailAddress: buyerEmail ? String(buyerEmail).trim() : undefined
    });
  } catch (err) {
    const detail = err?.errors?.[0]?.detail || err?.message || 'Square payment failed.';
    const e = new Error(detail);
    e.statusCode = err?.statusCode || 402;
    e.errors = err?.errors;
    throw e;
  }

  const payment = result?.payment;
  if (!payment?.id) {
    const err = new Error('Square did not return a payment.');
    err.statusCode = 502;
    throw err;
  }

  const status = payment.status;
  if (status !== 'COMPLETED' && status !== 'APPROVED') {
    const err = new Error(`Payment not completed (status: ${status}).`);
    err.statusCode = 402;
    throw err;
  }

  return {
    paymentId: payment.id,
    status,
    orderId: orderId || null,
    buyerName: buyerName || null,
    buyerEmail: buyerEmail || null,
    amountCents: amount,
    receiptUrl: payment.receiptUrl || null
  };
}
