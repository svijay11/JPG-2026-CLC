import { Resend } from 'resend';

function parseRecipients(value) {
  return String(value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmailBodies(orderMeta = {}, orderSummary = '') {
  const orderId = orderMeta.orderId || 'Unknown order';
  const buyerName = orderMeta.buyerName || 'Customer';
  const subject = `New label order ${orderId} — Idyll Time Wines`;

  const text = [
    'A new custom label order was placed.',
    '',
    `Order: ${orderId}`,
    `Customer: ${buyerName}`,
    `Date: ${orderMeta.orderDate || new Date().toISOString()}`,
    `Delivery: ${orderMeta.deliveryMethod || 'pickup'}`,
    '',
    orderSummary || '(No summary)',
    '',
    'The full print-ready PDF is attached.'
  ].join('\n');

  const html = `
    <div style="font-family: Georgia, serif; color: #1a1a1a; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">New custom label order</h2>
      <p style="margin: 0 0 8px;"><strong>Order:</strong> ${escapeHtml(orderId)}</p>
      <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${escapeHtml(buyerName)}</p>
      <p style="margin: 0 0 8px;"><strong>Delivery:</strong> ${escapeHtml(orderMeta.deliveryMethod || 'pickup')}</p>
      <pre style="margin: 16px 0; padding: 12px; background: #f7f5f0; border-radius: 8px; white-space: pre-wrap; font-family: ui-monospace, monospace; font-size: 13px;">${escapeHtml(orderSummary || '')}</pre>
      <p style="margin: 0; color: #555;">The full print-ready PDF is attached (receipt + customer + designer pages).</p>
    </div>
  `;

  return { subject, text, html };
}

/**
 * Send the order notification email via Resend.
 * `env` must include RESEND_API_KEY (never expose that to the browser).
 */
export async function sendOrderNotificationEmail(payload, env = process.env) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error('Missing RESEND_API_KEY on the server.');
    err.statusCode = 500;
    throw err;
  }

  const to = parseRecipients(env.ORDER_NOTIFY_EMAILS || 'siddharthvijaym@gmail.com');
  if (to.length === 0) {
    const err = new Error('ORDER_NOTIFY_EMAILS is empty.');
    err.statusCode = 500;
    throw err;
  }

  const from = env.RESEND_FROM_EMAIL || 'Idyll Time Wines <onboarding@resend.dev>';
  const {
    orderMeta = {},
    orderSummary = '',
    pdfBase64,
    pdfFilename = 'idyll-time-order.pdf'
  } = payload || {};

  if (!pdfBase64 || typeof pdfBase64 !== 'string') {
    const err = new Error('Missing order PDF attachment.');
    err.statusCode = 400;
    throw err;
  }

  // Strip data-URL prefix if the client included one.
  const base64 = pdfBase64.includes(',') ? pdfBase64.split(',').pop() : pdfBase64;
  const { subject, text, html } = buildEmailBodies(orderMeta, orderSummary);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: pdfFilename.replace(/[^\w.\-#]+/g, '_'),
        content: base64
      }
    ]
  });

  if (error) {
    const err = new Error(error.message || 'Resend failed to send email.');
    err.statusCode = 502;
    err.details = error;
    throw err;
  }

  return {
    ok: true,
    id: data?.id || null,
    to
  };
}
