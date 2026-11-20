import { Resend } from 'resend';
import { getStripeClient } from './stripeClient.js';

function parseRecipients(value) {
  return String(value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

async function notifyShopPaymentReceived(session, env) {
  const apiKey = env.RESEND_API_KEY;
  const recipients = parseRecipients(env.ORDER_NOTIFY_EMAILS);
  if (!apiKey || recipients.length === 0) {
    console.info('Webhook: skipping shop email (RESEND_API_KEY or ORDER_NOTIFY_EMAILS missing).');
    return;
  }

  const from = env.RESEND_FROM_EMAIL || 'Idyll Time Wines <onboarding@resend.dev>';
  const orderId = session.metadata?.order_id || session.id;
  const buyer = session.metadata?.buyer_name || session.customer_details?.name || 'Customer';
  const delivery = session.metadata?.delivery_method || 'pickup';
  const amount = session.amount_total != null
    ? `$${(session.amount_total / 100).toFixed(2)} ${String(session.currency || 'usd').toUpperCase()}`
    : 'unknown';

  const lines = [
    'Stripe payment confirmed for a custom label order.',
    '',
    `Order: ${orderId}`,
    `Customer: ${buyer}`,
    `Email: ${session.customer_details?.email || 'n/a'}`,
    `Delivery: ${delivery}`,
    `Amount: ${amount}`,
    `Checkout session: ${session.id}`,
    '',
    delivery === 'shipping'
      ? [
          'Ship to:',
          session.metadata?.ship_name,
          session.metadata?.ship_street,
          `${session.metadata?.ship_city || ''}, ${session.metadata?.ship_state || ''} ${session.metadata?.ship_zip || ''}`
        ].filter(Boolean).join('\n')
      : 'Pickup at winery.',
    '',
    'Print-ready PDF arrives from the customer session when they return to the site.'
  ];

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: recipients,
    subject: `Payment received ${orderId} — Idyll Time Wines`,
    text: lines.join('\n')
  });
}

/**
 * Verify signature and fulfill paid Checkout Sessions.
 * Handles checkout.session.completed and checkout.session.async_payment_succeeded.
 */
export async function handleStripeWebhook({ rawBody, signature, env = process.env }) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    const err = new Error('Missing STRIPE_WEBHOOK_SECRET on the server.');
    err.statusCode = 500;
    throw err;
  }

  const stripe = getStripeClient(env);
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const e = new Error(`Webhook signature verification failed: ${err.message}`);
    e.statusCode = 400;
    throw e;
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object;
    if (session.payment_status === 'unpaid') {
      console.info(`Webhook ${event.type}: session ${session.id} still unpaid — waiting.`);
      return { received: true, fulfilled: false };
    }

    try {
      await notifyShopPaymentReceived(session, env);
    } catch (err) {
      console.error('Webhook shop email failed:', err);
      // Still acknowledge the event so Stripe does not retry forever for email blips.
    }

    return { received: true, fulfilled: true, orderId: session.metadata?.order_id || null };
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    console.warn('Async payment failed for session', event.data.object?.id);
  }

  return { received: true, fulfilled: false };
}
