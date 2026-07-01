import { DEFAULT_RIBBON_COLOR_ID } from '../config/ribbonColors';

/** Recolor the ribbon artwork while preserving fold shading. */
export function drawTintedRibbon(ctx, img, x, y, w, h, tintColor, colorId = DEFAULT_RIBBON_COLOR_ID) {
  ctx.drawImage(img, x, y, w, h);
  if (!tintColor || colorId === DEFAULT_RIBBON_COLOR_ID) return;

  ctx.save();
  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle = tintColor;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = tintColor;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}
