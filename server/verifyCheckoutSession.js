import { getStripeClient } from './stripeClient.js';

/**
 * Confirm a Checkout Session was paid before unlocking post-purchase UI.
 * Fulfillment (shop email) should still be driven by webhooks for async methods.
 */
export async function verifyCheckoutSession(sessionId, env = process.env) {
  if (!sessionId || typeof sessionId !== 'string') {
    const err = new Error('Missing Checkout Session ID.');
    err.statusCode = 400;
    throw err;
  }

  const stripe = getStripeClient(env);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const paid =
    session.status === 'complete' &&
    (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');

  return {
    paid,
    sessionId: session.id,
    paymentStatus: session.payment_status,
    status: session.status,
    orderId: session.metadata?.order_id || null,
    buyerName: session.metadata?.buyer_name || session.customer_details?.name || 'Customer',
    customerEmail: session.customer_details?.email || null,
    deliveryMethod: session.metadata?.delivery_method || 'pickup',
    amountTotal: session.amount_total,
    currency: session.currency,
    paymentMethod: 'stripe'
  };
}
