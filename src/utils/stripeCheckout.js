import { SHAPES } from '../config/shapes';
import { MATERIALS } from '../config/pricing';
import { getLabelSheet } from '../config/labelSheets';
import { savePendingOrder } from './pendingOrderStore';

function buildItemDescription(item) {
  const shapeName = SHAPES.find((s) => s.id === item.shape)?.name || item.shape;
  const materialName = item.material
    ? (MATERIALS.find((m) => m.id === item.material)?.name || item.material)
    : 'Standard 4CP';
  const sheet = item.labelSheetId ? getLabelSheet(item.labelSheetId)?.name : null;
  const parts = [shapeName, materialName];
  if (sheet) parts.push(sheet);
  if (item.uvEnabled) parts.push('UV coating');
  return parts.join(' · ');
}

/**
 * Persist cart locally, create a Stripe Checkout Session, then redirect.
 */
export async function startStripeCheckout({
  cartItems,
  deliveryMethod,
  shippingAddress,
  shippingCost,
  buyerName = ''
}) {
  const orderId = `#${Date.now().toString().slice(-10)}`;
  const orderDate = new Date().toISOString();
  const buyerId = Math.random().toString(36).slice(2, 19);

  const orderMeta = {
    paymentMethod: 'stripe',
    buyerName: buyerName.trim() || 'Customer',
    orderDate,
    orderId,
    buyerId,
    deliveryMethod,
    shippingAddress,
    shippingCost
  };

  await savePendingOrder(orderId, {
    items: cartItems,
    orderMeta
  });

  const origin = window.location.origin;
  const successUrl = `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}&order_id=${encodeURIComponent(orderId)}`;
  const cancelUrl = `${origin}/?checkout=cancelled&order_id=${encodeURIComponent(orderId)}`;

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      buyerName: orderMeta.buyerName,
      deliveryMethod,
      shippingAddress,
      shippingCost,
      successUrl,
      cancelUrl,
      items: cartItems.map((item, index) => ({
        name: `Custom wine label #${index + 1}`,
        description: buildItemDescription(item),
        unitPrice: item.unitPrice,
        quantity: item.quantity
      }))
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.url) {
    throw new Error(data.error || 'Could not start Stripe Checkout.');
  }

  window.location.assign(data.url);
}

export async function verifyPaidSession(sessionId) {
  const response = await fetch('/api/verify-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.paid) {
    throw new Error(data.error || 'Payment could not be verified.');
  }
  return data;
}
