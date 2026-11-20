import { getStripeClient } from './stripeClient.js';

function toCents(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function truncate(value, max) {
  const s = String(value || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * Create a Stripe Checkout Session (hosted) for a one-time cart payment.
 * Uses price_data so we don't need pre-created Products/Prices for custom labels.
 */
export async function createCheckoutSession(payload = {}, env = process.env) {
  const stripe = getStripeClient(env);
  const {
    items = [],
    deliveryMethod = 'pickup',
    shippingAddress = null,
    shippingCost = 0,
    orderId,
    buyerName = '',
    successUrl,
    cancelUrl
  } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Cart is empty.');
    err.statusCode = 400;
    throw err;
  }

  if (!successUrl || !cancelUrl) {
    const err = new Error('Missing success or cancel URL.');
    err.statusCode = 400;
    throw err;
  }

  if (!orderId) {
    const err = new Error('Missing order ID.');
    err.statusCode = 400;
    throw err;
  }

  const line_items = items.map((item, index) => {
    const unitAmount = Number.isInteger(item.unitAmountCents)
      ? item.unitAmountCents
      : toCents(item.unitPrice);
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

    if (unitAmount < 1) {
      const err = new Error(`Invalid price for cart item ${index + 1}.`);
      err.statusCode = 400;
      throw err;
    }

    return {
      quantity,
      price_data: {
        currency: 'usd',
        unit_amount: unitAmount,
        product_data: {
          name: truncate(item.name || `Custom wine label #${index + 1}`, 120),
          description: truncate(item.description || 'Custom printed wine label', 500) || undefined
        }
      }
    };
  });

  const shippingCents = Number.isInteger(payload.shippingCostCents)
    ? payload.shippingCostCents
    : toCents(shippingCost);

  if (deliveryMethod === 'shipping' && shippingCents > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: shippingCents,
        product_data: {
          name: 'USPS shipping'
        }
      }
    });
  }

  const metadata = {
    order_id: truncate(orderId, 500),
    delivery_method: deliveryMethod === 'shipping' ? 'shipping' : 'pickup',
    buyer_name: truncate(buyerName || 'Customer', 500),
    item_count: String(items.length)
  };

  if (deliveryMethod === 'shipping' && shippingAddress) {
    metadata.ship_name = truncate(shippingAddress.name, 500);
    metadata.ship_street = truncate(shippingAddress.street, 500);
    metadata.ship_city = truncate(shippingAddress.city, 500);
    metadata.ship_state = truncate(shippingAddress.state, 500);
    metadata.ship_zip = truncate(shippingAddress.zip, 500);
  }

  // Checkout Studio fixed_by_ui params. mode/success_url/cancel_url/line_items preserved (sample_only, real values).
  // payment_method_collection omitted — only valid when mode is "subscription".
  // ui_mode: API requires hosted_page (SDK 20.4.1; "hosted" rejected by Stripe).
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'hosted_page',
    mode: 'payment',
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    automatic_tax: { enabled: false },
    allow_promotion_codes: false,
    submit_type: 'auto',
    shipping_address_collection: {
      allowed_countries: ['US']
    },
    name_collection: {
      individual: {
        enabled: true,
        optional: true
      }
    },
    integration_identifier: 'hosted_web_0001',
    origin_context: 'web'
  });

  return {
    sessionId: session.id,
    url: session.url,
    orderId: metadata.order_id
  };
}
