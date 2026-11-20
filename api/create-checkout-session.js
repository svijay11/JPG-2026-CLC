import { createCheckoutSession } from '../server/createCheckoutSession.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await createCheckoutSession(req.body, process.env);
    return res.status(200).json(result);
  } catch (err) {
    console.error('create-checkout-session failed:', err);
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Failed to create Checkout Session.'
    });
  }
}
