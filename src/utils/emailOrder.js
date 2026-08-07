import { SHAPES } from '../config/shapes';
import { MATERIALS } from '../config/pricing';
import { getLabelSheet } from '../config/labelSheets';
import { getRibbonColor } from '../config/ribbonColors';
import { buildOrderReceiptPdfBase64 } from '../utils/exportOrderPdf';

function formatMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '$0.00';
}

function formatShippingAddress(shippingAddress) {
  if (!shippingAddress) return '';
  if (typeof shippingAddress === 'string') return shippingAddress.trim();
  const { name, street, city, state, zip } = shippingAddress;
  return [
    name?.trim(),
    street?.trim(),
    [city?.trim(), state?.trim()].filter(Boolean).join(', ') + (zip?.trim() ? ` ${zip.trim()}` : '')
  ].filter(Boolean).join('\n');
}

/** Plain-text summary used in the shop notification email. */
export function buildOrderEmailSummary(items = [], orderMeta = {}) {
  const lines = [];

  items.forEach((item, index) => {
    const shape = SHAPES.find((s) => s.id === item.shape);
    const material = MATERIALS.find((m) => m.id === item.material);
    const sheet = item.labelSheetId ? getLabelSheet(item.labelSheetId) : null;
    const segments = (item.textSegments || []).filter((s) => s?.text?.trim());

    lines.push(`Item ${index + 1}: ${shape?.name || item.shape}`);
    lines.push(`  Qty: ${item.quantity}`);
    lines.push(`  Finish: ${material?.name || item.material || 'Standard 4CP'}`);
    if (sheet) lines.push(`  Label sheet: ${sheet.name}`);
    if (item.uvEnabled) lines.push('  UV coating: Yes');
    if (item.ribbonColorId) {
      lines.push(`  Ribbon color: ${getRibbonColor(item.ribbonColorId).name}`);
    }
    segments.forEach((segment, segIndex) => {
      const label = segments.length > 1 ? `Text ${segIndex + 1}` : 'Text';
      lines.push(`  ${label}: ${segment.text.trim()}`);
      lines.push(`    Font: ${segment.font || 'Playfair Display'}`);
      lines.push(`    Size: ${segment.fontSize ?? 16}px`);
      lines.push(`    Color: ${segment.color || '#000000'}`);
    });
    lines.push(`  Line total: ${formatMoney(item.totalPrice)}`);
    lines.push('');
  });

  const itemTotal = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const shippingCost = orderMeta.deliveryMethod === 'shipping'
    ? (Number(orderMeta.shippingCost) || 0)
    : 0;

  lines.push(`Item total: ${formatMoney(itemTotal)}`);
  if (orderMeta.deliveryMethod === 'shipping') {
    lines.push(`Shipping: ${formatMoney(shippingCost)}`);
    const address = formatShippingAddress(orderMeta.shippingAddress);
    if (address) {
      lines.push('Ship to:');
      lines.push(address);
    }
  } else {
    lines.push('Delivery: Pickup');
  }
  lines.push(`Order total: ${formatMoney(itemTotal + shippingCost)}`);

  return lines.join('\n');
}

/**
 * Build the order PDF and notify the shop emails via the server API.
 * The Resend API key never leaves the server.
 */
export async function emailOrderToShop(items, orderMeta = {}) {
  const pdfBase64 = await buildOrderReceiptPdfBase64(items, orderMeta);
  const orderIdSafe = String(orderMeta.orderId || Date.now()).replace(/[^\w#-]+/g, '');
  const pdfFilename = `idyll-time-order-${orderIdSafe || 'order'}.pdf`;

  const response = await fetch('/api/send-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderMeta: {
        orderId: orderMeta.orderId,
        buyerName: orderMeta.buyerName,
        orderDate: orderMeta.orderDate,
        deliveryMethod: orderMeta.deliveryMethod,
        shippingAddress: orderMeta.shippingAddress,
        shippingCost: orderMeta.shippingCost,
        paymentMethod: orderMeta.paymentMethod
      },
      orderSummary: buildOrderEmailSummary(items, orderMeta),
      pdfBase64,
      pdfFilename
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Order email failed (${response.status})`);
  }
  return data;
}
