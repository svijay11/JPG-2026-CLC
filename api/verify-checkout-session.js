import { verifyCheckoutSession } from '../server/verifyCheckoutSession.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionId =
      req.method === 'GET'
        ? req.query?.session_id
        : req.body?.sessionId || req.body?.session_id;

    const result = await verifyCheckoutSession(sessionId, process.env);
    if (!result.paid) {
      return res.status(402).json({
        error: 'Payment not completed.',
        ...result
      });
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error('verify-checkout-session failed:', err);
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Failed to verify Checkout Session.'
    });
  }
}
