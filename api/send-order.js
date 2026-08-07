import { sendOrderNotificationEmail } from '../server/sendOrderEmail.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await sendOrderNotificationEmail(req.body, process.env);
    return res.status(200).json(result);
  } catch (err) {
    console.error('send-order failed:', err?.details || err);
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Failed to send order email.'
    });
  }
}
