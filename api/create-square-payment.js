import { createSquarePayment } from '../server/createSquarePayment.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await createSquarePayment(req.body, process.env);
    return res.status(200).json(result);
  } catch (err) {
    console.error('create-square-payment failed:', err?.errors || err);
    const detail = err?.errors?.[0]?.detail;
    return res.status(err.statusCode || 500).json({
      error: detail || err.message || 'Failed to process Square payment.'
    });
  }
}
