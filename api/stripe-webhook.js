import { handleStripeWebhook } from '../server/handleStripeWebhook.js';

export const config = {
  api: {
    bodyParser: false
  }
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header.' });
    }

    const result = await handleStripeWebhook({
      rawBody,
      signature,
      env: process.env
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('stripe-webhook failed:', err);
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Webhook handler failed.'
    });
  }
}
