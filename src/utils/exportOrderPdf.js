import { jsPDF } from 'jspdf';
import { SHAPES, shapeIsTextOnly, getShapeSize } from '../config/shapes';
import { MATERIALS } from '../config/pricing';
import { getRibbonColor } from '../config/ribbonColors';
import { getLabelSheet } from '../config/labelSheets';
import { renderLabelExportCanvasPair, cropCanvasToBounds, computePdfLabelDrawSizeMm, getPrintExportRenderOptions, PREVIEW_LOGICAL_SIZE, PREVIEW_MAX_TARGET } from './renderLabelExport';

const SHOP_NAME = 'Idyll Time Wines';
const SHOP_URL = 'idylltimewines.com';
const DEFAULT_SHIPPING_COST = 6;

/** jsPDF Helvetica only supports Latin-1 — normalize punctuation from our UI strings. */
function pdfText(value) {
  return String(value ?? '')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u00d7/g, 'x')
    .replace(/\u2033/g, '"')
    .replace(/\u2032/g, "'");
}

function writeTextBlock(pdf, text, x, y, maxWidth, lineHeight = 4.8) {
  const lines = pdf.splitTextToSize(pdfText(text), maxWidth);
  lines.forEach((line) => {
    pdf.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

function formatOrderDate(date = new Date()) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function generateOrderId() {
  return `#${Date.now().toString().slice(-10)}`;
}

function generateBuyerId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 17; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function paymentLabel(method) {
  if (method === 'apple') return 'Paid via Apple Pay';
  if (method === 'google') return 'Paid via Google Pay';
  if (method === 'card') return 'Paid via Credit Card';
  return 'Paid at checkout';
}

function getShippingCost(orderMeta = {}) {
  if (orderMeta.deliveryMethod !== 'shipping') return 0;
  return typeof orderMeta.shippingCost === 'number'
    ? orderMeta.shippingCost
    : DEFAULT_SHIPPING_COST;
}

function formatShippingAddressLines(shippingAddress) {
  if (!shippingAddress) return [];

  if (typeof shippingAddress === 'string') {
    const trimmed = shippingAddress.trim();
    return trimmed ? trimmed.split(/\r?\n/) : [];
  }

  const { name, street, city, state, zip } = shippingAddress;
  const lines = [];
  if (name?.trim()) lines.push(name.trim());
  if (street?.trim()) lines.push(street.trim());
  const cityLine = [city?.trim(), state?.trim()].filter(Boolean).join(', ');
  const cityStateZip = [cityLine, zip?.trim()].filter(Boolean).join(' ');
  if (cityStateZip) lines.push(cityStateZip);
  return lines;
}

function getDeliveryLines(orderMeta = {}) {
  if (orderMeta.deliveryMethod === 'shipping') {
    const lines = [`USPS Shipping ($${getShippingCost(orderMeta).toFixed(2)})`];
    return lines.concat(formatShippingAddressLines(orderMeta.shippingAddress));
  }
  return ['Pickup (free)'];
}

function hr(pdf, x1, x2, y) {
  pdf.setDrawColor(210, 210, 210);
  pdf.setLineWidth(0.35);
  pdf.line(x1, y, x2, y);
}

function drawLeftField(pdf, x, y, label, lines) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(34, 34, 34);
  pdf.text(label, x, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  let cy = y + 5.2;
  lines.forEach((line) => {
    pdf.text(pdfText(line), x, cy);
    cy += 4.8;
  });
  return cy + 6;
}

function getItemTitle(item) {
  const shapeName = SHAPES.find((s) => s.id === item.shape)?.name || item.shape;
  return `${shapeName} Wine Label`;
}

function getItemOptions(item) {
  const lines = [];
  const shape = SHAPES.find((s) => s.id === item.shape);
  const material = MATERIALS.find((m) => m.id === item.material);
  const materialName = material?.name || 'Standard 4CP — Original Border';
  lines.push(`Finish: ${materialName}`);

  const size = getShapeSize(shape);
  if (size) lines.push(`Size: ${size}`);

  if (item.labelSheetId) {
    lines.push(`Label sheet: ${getLabelSheet(item.labelSheetId).name}`);
  }

  if (item.uvEnabled) lines.push('UV coating: Yes');

  if (shapeIsTextOnly(shape)) {
    if (item.ribbonColorId) {
      lines.push(`Ribbon color: ${getRibbonColor(item.ribbonColorId).name}`);
    }
  }

  const text = item.textSegments?.map((s) => s.text).filter(Boolean).join(', ');
  if (text) lines.push(`Text: ${text}`);

  return lines;
}

function computeOrderTotals(items, orderMeta = {}) {
  const itemTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingCost = getShippingCost(orderMeta);
  const subtotal = itemTotal;
  const orderTotal = subtotal + shippingCost;
  return { itemTotal, shippingCost, subtotal, orderTotal };
}

function drawReceiptPage(pdf, items, orderMeta) {
  const pageW = pdf.internal.pageSize.getWidth();
  const leftX = 18;
  const rightX = 98;
  const rightEdge = pageW - 18;
  const orderId = orderMeta.orderId || generateOrderId();
  const buyerName = orderMeta.buyerName || 'Customer';
  const buyerId = orderMeta.buyerId || generateBuyerId();
  const orderDate = orderMeta.orderDate
    ? formatOrderDate(new Date(orderMeta.orderDate))
    : formatOrderDate();
  const payment = paymentLabel(orderMeta.paymentMethod);

  let y = 22;

  // Shop header (spans top-left like Etsy)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(20, 20, 20);
  pdf.text(SHOP_NAME, leftX, y);

  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(34, 34, 34);
  pdf.text(SHOP_URL, leftX, y);

  // Right column header aligns with order block
  const itemsHeaderY = 48;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(`${items.length} item${items.length === 1 ? '' : 's'}`, rightX, itemsHeaderY);
  hr(pdf, rightX, rightEdge, itemsHeaderY + 3);

  // Left column — order metadata
  let leftY = 48;
  leftY = drawLeftField(pdf, leftX, leftY, 'Order', [orderId]);
  leftY = drawLeftField(pdf, leftX, leftY, 'Order date', [orderDate]);
  leftY = drawLeftField(pdf, leftX, leftY, 'Buyer', [`${buyerName} (${buyerId})`]);
  leftY = drawLeftField(pdf, leftX, leftY, 'Payment method', [payment]);
  drawLeftField(pdf, leftX, leftY, 'Delivery', getDeliveryLines(orderMeta));

  // Right column — line items
  let itemY = itemsHeaderY + 12;
  const thumbSize = 18;

  items.forEach((item) => {
    const title = getItemTitle(item);
    const options = getItemOptions(item);
    const unitPrice = item.unitPrice ?? item.totalPrice / (item.quantity || 1);
    const qtyPrice = `${item.quantity} x $${unitPrice.toFixed(2)}`;

    if (item.thumbnail) {
      try {
        const format = item.thumbnail.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        pdf.addImage(item.thumbnail, format, rightX, itemY - 4, thumbSize, thumbSize);
      } catch {
        // skip broken thumbnail
      }
    }

    const textX = rightX + thumbSize + 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(20, 20, 20);
    pdf.text(pdfText(title), textX, itemY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(34, 34, 34);
    let optY = itemY + 5;
    const optMaxWidth = rightEdge - textX - 28;
    options.forEach((opt) => {
      optY = writeTextBlock(pdf, opt, textX, optY, optMaxWidth, 4.5);
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.text(qtyPrice, rightEdge, itemY, { align: 'right' });

    itemY = Math.max(itemY + 16, optY + 6);
  });

  hr(pdf, rightX, rightEdge, itemY);

  // Totals (Etsy-style)
  const { itemTotal, shippingCost, subtotal, orderTotal } = computeOrderTotals(items, orderMeta);
  let totalY = itemY + 10;
  const labelX = rightEdge - 42;

  const drawTotalRow = (label, amount, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(20, 20, 20);
    pdf.text(label, labelX, totalY);
    pdf.text(`$${amount.toFixed(2)}`, rightEdge, totalY, { align: 'right' });
    totalY += 7;
  };

  drawTotalRow('Item total', itemTotal);
  drawTotalRow('Subtotal', subtotal);
  if (shippingCost > 0) {
    drawTotalRow('Shipping (USPS)', shippingCost);
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(20, 20, 20);
    pdf.text('Pickup', labelX, totalY);
    pdf.text('Free', rightEdge, totalY, { align: 'right' });
    totalY += 7;
  }
  drawTotalRow('Order total', orderTotal, true);
}

async function addPrintReadyPageFromImageData(pdf, imgData, exportBounds, trimLayout, item, { noEmbellishments = false } = {}) {
  pdf.addPage('letter', 'portrait');

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const topMargin = 14;
  const margin = 14;
  const maxW = pageW - margin * 2;
  const maxH = pageH - topMargin - margin;

  if (noEmbellishments) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(90, 90, 90);
    pdf.text('Designer print file -- no embellishments (photo, text, and bleed only)', 14, 10);
  }

  let { width: drawWmm, height: drawHmm } = computePdfLabelDrawSizeMm(
    exportBounds,
    trimLayout,
    item.shape
  );

  const fitScale = Math.min(1, maxW / drawWmm, maxH / drawHmm);
  drawWmm *= fitScale;
  drawHmm *= fitScale;

  const x = (pageW - drawWmm) / 2;
  const y = topMargin + Math.max(0, (maxH - drawHmm) / 2);
  const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
  pdf.addImage(imgData, format, x, y, drawWmm, drawHmm);
}

async function addPrintReadyPageFromRender(pdf, renderResult, item, { noEmbellishments = false } = {}) {
  const cropped = cropCanvasToBounds(renderResult.canvas, renderResult.exportBounds);
  let imgData;
  try {
    imgData = cropped.toDataURL('image/png');
  } catch {
    imgData = cropped.toDataURL('image/jpeg', 0.92);
  }
  await addPrintReadyPageFromImageData(
    pdf,
    imgData,
    renderResult.exportBounds,
    renderResult.trimLayout,
    item,
    { noEmbellishments }
  );
}

async function addPrintReadyPage(pdf, item, { noEmbellishments = false } = {}) {
  const storedUrl = noEmbellishments ? item.designerPrintDataUrl : item.customerPrintDataUrl;
  const storedBounds = item.printExportBounds;
  const storedLooksPrintable =
    storedUrl &&
    item.printTrimLayout &&
    storedBounds &&
    Math.max(storedBounds.w || 0, storedBounds.h || 0) >=
      Math.max(
        getPrintExportRenderOptions(item.shape).logicalSize * (PREVIEW_MAX_TARGET / PREVIEW_LOGICAL_SIZE) * 0.85,
        900
      );

  if (storedLooksPrintable) {
    await addPrintReadyPageFromImageData(
      pdf,
      storedUrl,
      item.printExportBounds,
      item.printTrimLayout,
      item,
      { noEmbellishments }
    );
    return;
  }

  // Re-render at print DPI when snapshots are missing or from the old preview-resolution path.
  const pair = await renderLabelExportCanvasPair(item, getPrintExportRenderOptions(item.shape));
  const renderResult = noEmbellishments ? pair.designer : pair.customer;
  await addPrintReadyPageFromRender(pdf, renderResult, item, { noEmbellishments });
}

/**
 * Etsy-style order receipt (page 1) + print-ready label preview(s) (page 2+),
 * plus a no-embellishments designer page for every item.
 */
export async function buildOrderReceiptPdf(items, orderMeta = {}) {
  await document.fonts.ready;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true });
  drawReceiptPage(pdf, items, orderMeta);

  for (const item of items) {
    await addPrintReadyPage(pdf, item, { noEmbellishments: false });
    await addPrintReadyPage(pdf, item, { noEmbellishments: true });
  }

  return pdf;
}

export async function buildOrderReceiptPdfBase64(items, orderMeta = {}) {
  const pdf = await buildOrderReceiptPdf(items, orderMeta);
  return pdf.output('datauristring').split(',')[1];
}

export async function exportOrderReceiptPdf(items, orderMeta = {}, filename = 'idyll-time-order.pdf') {
  const pdf = await buildOrderReceiptPdf(items, orderMeta);
  pdf.save(filename);
  return filename;
}

export async function exportCartItemToPdf(item, index = 0, orderMeta = {}) {
  const shapeName = SHAPES.find((s) => s.id === item.shape)?.name || item.shape;
  const safeName = shapeName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
  await exportOrderReceiptPdf([item], orderMeta, `idyll-time-order-${safeName}-${index + 1}.pdf`);
  return safeName;
}

export async function exportAllCartItemsToPdf(cartItems, orderMeta = {}) {
  await exportOrderReceiptPdf(cartItems, orderMeta, 'idyll-time-order.pdf');
  return cartItems.length;
}
