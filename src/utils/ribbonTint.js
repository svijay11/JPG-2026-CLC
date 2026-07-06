import { DEFAULT_RIBBON_COLOR_ID } from '../config/ribbonColors';

function parseHex(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p, q, t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  ];
}

const recolorCache = new Map();

function getRecoloredRibbonCanvas(img, tintColor) {
  const key = `${img.src}|${img.width}x${img.height}|${tintColor}`;
  if (recolorCache.has(key)) return recolorCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const octx = canvas.getContext('2d');
  octx.drawImage(img, 0, 0);

  const imageData = octx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const tint = parseHex(tintColor);
  const [tintH, tintS, tintL] = rgbToHsl(tint.r, tint.g, tint.b);
  const isNeutralTint = tintS < 0.08;

  let lightnessSum = 0;
  let lightnessCount = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    lightnessSum += rgbToHsl(d[i], d[i + 1], d[i + 2])[2];
    lightnessCount += 1;
  }
  const meanL = lightnessCount ? lightnessSum / lightnessCount : 0.65;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;

    const [, , origL] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    let nextL = origL;

    if (isNeutralTint) {
      // White / black: keep fold contrast around the target lightness.
      nextL = Math.max(0, Math.min(1, tintL + (origL - meanL) * 0.55));
    }

    const [nr, ng, nb] = isNeutralTint
      ? hslToRgb(0, 0, nextL)
      : hslToRgb(tintH, tintS, origL);

    d[i] = nr;
    d[i + 1] = ng;
    d[i + 2] = nb;
  }

  octx.putImageData(imageData, 0, 0);
  recolorCache.set(key, canvas);
  return canvas;
}

/** Recolor the ribbon while preserving the original artwork's shadows and creases. */
export function drawTintedRibbon(ctx, img, x, y, w, h, tintColor, colorId = DEFAULT_RIBBON_COLOR_ID) {
  if (!tintColor || colorId === DEFAULT_RIBBON_COLOR_ID) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }

  const recolored = getRecoloredRibbonCanvas(img, tintColor);
  ctx.drawImage(recolored, x, y, w, h);
}
