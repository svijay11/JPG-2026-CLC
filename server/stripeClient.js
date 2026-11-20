import Stripe from 'stripe';

/**
 * Shared Stripe client. Prefer a restricted key (rk_…) over sk_… in production.
 * Secret must never be exposed to the browser (no VITE_ prefix).
 */
export function getStripeClient(env = process.env) {
  const secretKey = env.STRIPE_SECRET_KEY || env.STRIPE_API_KEY;
  if (!secretKey) {
    const err = new Error('Missing STRIPE_SECRET_KEY on the server.');
    err.statusCode = 500;
    throw err;
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-10-28.endive',
    appInfo: {
      name: 'JPG-2026 Label Designer',
      version: '0.0.0',
      url: 'https://idylltimewines.com'
    }
  });
}
