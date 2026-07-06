const dieLineCache = new Map();
const foilClipCache = new Map();

function cacheKey(sampleSrc, w, h, innerInset) {
  return `${sampleSrc}|${w}|${h}|${innerInset}`;
}

function foilClipCacheKey(foilSrc, w, h) {
  return `${foilSrc}|${w}|${h}`;
}

function readAlpha(imageData, x, y, width) {
  return imageData.data[(y * width + x) * 4 + 3];
}

function buildOpaqueGrid(imageData, width, height, threshold = 128) {
  const grid = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid[y * width + x] = readAlpha(imageData, x, y, width) >= threshold ? 1 : 0;
    }
  }
  return grid;
}

function buildMagentaStrokeGrid(imageData, width, height) {
  const grid = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      if (a >= 128 && r > 140 && g < 130 && b > 90) {
        grid[y * width + x] = 1;
      }
    }
  }
  return grid;
}

function buildCyanStrokeGrid(imageData, width, height) {
  const grid = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      if (a >= 128 && b > 140 && g > 100 && r < 120 && b >= g) {
        grid[y * width + x] = 1;
      }
    }
  }
  return grid;
}

function erodeGrid(grid, width, height, radius) {
  if (radius <= 0) return grid.slice();
  const out = new Uint8Array(width * height);
  const r2 = radius * radius;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y * width + x]) continue;
      let keep = true;
      for (let dy = -radius; dy <= radius && keep; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || dx * dx + dy * dy > r2) {
            keep = false;
            break;
          }
          if (!grid[ny * width + nx]) {
            keep = false;
            break;
          }
        }
      }
      if (keep) out[y * width + x] = 1;
    }
  }
  return out;
}

function extractEdgePoints(grid, width, height) {
  const points = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!grid[y * width + x]) continue;
      const neighborClear =
        !grid[y * width + (x - 1)] ||
        !grid[y * width + (x + 1)] ||
        !grid[(y - 1) * width + x] ||
        !grid[(y + 1) * width + x];
      if (neighborClear) points.push({ x, y });
    }
  }
  return points;
}

function orderEdgePoints(points) {
  if (points.length === 0) return [];
  const remaining = points.slice();
  const ordered = [remaining.shift()];
  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const dx = remaining[i].x - last.x;
      const dy = remaining[i].y - last.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    if (bestDist > 64) break;
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  return ordered;
}

function simplifyPoints(points, minDistance = 2) {
  if (points.length <= 2) return points;
  const simplified = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = simplified[simplified.length - 1];
    const dx = points[i].x - prev.x;
    const dy = points[i].y - prev.y;
    if (dx * dx + dy * dy >= minDistance * minDistance) simplified.push(points[i]);
  }
  return simplified;
}

function pointsToPath(points, offsetX, offsetY) {
  if (points.length < 2) return null;
  const path = new Path2D();
  path.moveTo(points[0].x + offsetX, points[0].y + offsetY);
  for (let i = 1; i < points.length; i++) {
    path.lineTo(points[i].x + offsetX, points[i].y + offsetY);
  }
  path.closePath();
  return path;
}

export function computeSampleLabelLayout(sampleImg, maxTargetSize = 420) {
  const imgRatio = sampleImg.width / sampleImg.height;
  let w;
  let h;
  if (imgRatio >= 1) {
    w = maxTargetSize;
    h = maxTargetSize / imgRatio;
  } else {
    h = maxTargetSize;
    w = maxTargetSize * imgRatio;
  }
  return {
    x: 300 - w / 2,
    y: 300 - h / 2,
    w,
    h
  };
}

export function getSampleAlphaData(sampleImg, layout) {
  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.round(layout.w));
  off.height = Math.max(1, Math.round(layout.h));
  const ctx = off.getContext('2d');
  ctx.drawImage(sampleImg, 0, 0, off.width, off.height);
  return ctx.getImageData(0, 0, off.width, off.height);
}

function buildOuterContourGrid(strokeGrid, width, height) {
  const out = new Uint8Array(width * height);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!strokeGrid[idx]) continue;

      const dist = Math.hypot(x - cx, y - cy);
      let isOuter = false;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            isOuter = true;
            break;
          }
          if (!strokeGrid[ny * width + nx]) {
            const ndist = Math.hypot(nx - cx, ny - cy);
            if (ndist >= dist - 0.25) {
              isOuter = true;
              break;
            }
          }
        }
        if (isOuter) break;
      }

      if (isOuter) out[idx] = 1;
    }
  }
  return out;
}

function drawEdgeContour(ctx, grid, width, height, offsetX, offsetY, strokeStyle, lineWidth = 1.5) {
  ctx.save();
  ctx.fillStyle = strokeStyle;
  const half = Math.max(0, Math.floor(lineWidth / 2));
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!grid[y * width + x]) continue;
      const edge =
        !grid[y * width + (x - 1)] ||
        !grid[y * width + (x + 1)] ||
        !grid[(y - 1) * width + x] ||
        !grid[(y + 1) * width + x];
      if (edge) {
        ctx.fillRect(offsetX + x - half, offsetY + y - half, lineWidth, lineWidth);
      }
    }
  }
  ctx.restore();
}

export function getDieLineData(sampleImg, layout, options = {}) {
  const {
    innerInsetRatio = 0.034,
    drawInnerDieLine = true,
    sampleSrc = sampleImg.src,
    strokeMode = null
  } = options;

  const innerInset = drawInnerDieLine
    ? Math.max(2, Math.round(Math.min(layout.w, layout.h) * innerInsetRatio))
    : 0;
  const key = cacheKey(`${sampleSrc}|${strokeMode || 'alpha'}`, layout.w, layout.h, innerInset);
  if (dieLineCache.has(key)) return dieLineCache.get(key);

  const imageData = getSampleAlphaData(sampleImg, layout);
  const width = imageData.width;
  const height = imageData.height;
  const opaque = strokeMode === 'magenta'
    ? buildMagentaStrokeGrid(imageData, width, height)
    : buildOpaqueGrid(imageData, width, height);

  const outerPoints = simplifyPoints(orderEdgePoints(extractEdgePoints(opaque, width, height)), 2);
  const outerPath = pointsToPath(outerPoints, layout.x, layout.y);

  let innerGrid = null;
  if (drawInnerDieLine && innerInset > 0) {
    innerGrid = erodeGrid(opaque, width, height, innerInset);
  }

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.putImageData(imageData, 0, 0);

  const data = {
    outerPath,
    outerGrid: opaque,
    innerGrid,
    maskCanvas,
    layout,
    gridSize: { width, height }
  };
  dieLineCache.set(key, data);
  return data;
}

function interiorMaskFromStrokeGrid(strokeGrid, width, height) {
  const seed = findPhotoClipSeed(strokeGrid, width, height);
  const filled = floodFillInterior(strokeGrid, width, height, seed);
  return filledRegionToMaskCanvas(filled, width, height);
}

/** Bleed clip = everything inside the outer cyan boundary (not just inside the inner stroke edge). */
function bleedInteriorMaskFromStrokeGrid(strokeGrid, width, height) {
  const outside = floodFillFromBorder(strokeGrid, width, height);
  const filled = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (!outside[i]) filled[i] = 1;
  }
  return filledRegionToMaskCanvas(filled, width, height);
}

function floodFillFromBorder(strokeGrid, width, height) {
  const outside = new Uint8Array(width * height);
  const queue = [];

  const trySeed = (x, y) => {
    const idx = y * width + x;
    if (strokeGrid[idx] || outside[idx]) return;
    outside[idx] = 1;
    queue.push({ x, y });
  };

  for (let x = 0; x < width; x++) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  while (queue.length > 0) {
    const { x, y } = queue.pop();
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 }
    ];
    for (const n of neighbors) {
      if (n.x < 0 || n.y < 0 || n.x >= width || n.y >= height) continue;
      const idx = n.y * width + n.x;
      if (outside[idx] || strokeGrid[idx]) continue;
      outside[idx] = 1;
      queue.push(n);
    }
  }
  return outside;
}

function computeBleedLayout(trimLayout, bleedImg, trimDieImg) {
  const bleedScaleW = bleedImg.width / trimDieImg.width;
  const bleedScaleH = bleedImg.height / trimDieImg.height;
  const w = trimLayout.w * bleedScaleW;
  const h = trimLayout.h * bleedScaleH;
  return {
    x: 300 - w / 2,
    y: 300 - h / 2,
    w,
    h
  };
}

/** Parse separate bleed (cyan) + trim (magenta) dieline PNGs aligned to the same artwork. */
export function getBleedDieLineData(bleedImg, trimDieImg, maxTargetSize = 420) {
  const trimLayout = computeSampleLabelLayout(trimDieImg, maxTargetSize);
  const bleedLayout = computeBleedLayout(trimLayout, bleedImg, trimDieImg);
  const key = cacheKey(`bleed|v3|${bleedImg.src}|${trimDieImg.src}`, bleedLayout.w, bleedLayout.h, 0);
  if (dieLineCache.has(key)) return dieLineCache.get(key);

  const bleedImageData = getSampleAlphaData(bleedImg, bleedLayout);
  const bw = bleedImageData.width;
  const bh = bleedImageData.height;
  const bleedStroke = buildCyanStrokeGrid(bleedImageData, bw, bh);
  const bleedOuterGrid = buildOuterContourGrid(bleedStroke, bw, bh);
  const bleedMaskCanvas = bleedInteriorMaskFromStrokeGrid(bleedStroke, bw, bh);

  const trimImageData = getSampleAlphaData(trimDieImg, trimLayout);
  const tw = trimImageData.width;
  const th = trimImageData.height;
  const trimStroke = buildMagentaStrokeGrid(trimImageData, tw, th);
  const trimOuterGrid = buildOuterContourGrid(trimStroke, tw, th);
  const trimMaskCanvas = interiorMaskFromStrokeGrid(trimStroke, tw, th);
  const trimPoints = simplifyPoints(orderEdgePoints(extractEdgePoints(trimOuterGrid, tw, th)), 2);
  const outerPath = pointsToPath(trimPoints, trimLayout.x, trimLayout.y);

  const data = {
    hasBleed: true,
    bleedLayout,
    trimLayout,
    bleedMaskCanvas,
    maskCanvas: trimMaskCanvas,
    bleedStrokeGrid: bleedStroke,
    bleedOuterGrid,
    outerGrid: trimStroke,
    trimOuterGrid,
    outerPath,
    innerGrid: null,
    layout: bleedLayout,
    gridSize: { width: tw, height: th },
    bleedGridSize: { width: bw, height: bh }
  };
  dieLineCache.set(key, data);
  return data;
}

/** Fill everything inside the bleed line with solid black (trim + margin + foil gaps). */
export function drawBleedInteriorBlack(ctx, dieData, bleedLayout, color = '#000000') {
  if (!dieData?.bleedMaskCanvas || !bleedLayout) return;

  const bleedMask = dieData.bleedMaskCanvas;
  const off = document.createElement('canvas');
  off.width = bleedMask.width;
  off.height = bleedMask.height;
  const offCtx = off.getContext('2d');
  offCtx.fillStyle = color;
  offCtx.fillRect(0, 0, off.width, off.height);
  offCtx.globalCompositeOperation = 'destination-in';
  offCtx.drawImage(bleedMask, 0, 0);
  ctx.drawImage(off, bleedLayout.x, bleedLayout.y, bleedLayout.w, bleedLayout.h);
}

/** @deprecated Prefer drawBleedInteriorBlack for foil labels. Ring-only variant. */
export function drawBleedMarginBlack(ctx, dieData, bleedLayout, trimLayout, color = '#000000') {
  if (!dieData?.hasBleed || !dieData.bleedMaskCanvas || !dieData.maskCanvas || !bleedLayout || !trimLayout) {
    return;
  }

  const bleedMask = dieData.bleedMaskCanvas;
  const trimMask = dieData.maskCanvas;
  const off = document.createElement('canvas');
  off.width = bleedMask.width;
  off.height = bleedMask.height;
  const offCtx = off.getContext('2d');

  offCtx.fillStyle = color;
  offCtx.fillRect(0, 0, off.width, off.height);
  offCtx.globalCompositeOperation = 'destination-in';
  offCtx.drawImage(bleedMask, 0, 0);

  const scaleX = off.width / bleedLayout.w;
  const scaleY = off.height / bleedLayout.h;
  const trimX = (trimLayout.x - bleedLayout.x) * scaleX;
  const trimY = (trimLayout.y - bleedLayout.y) * scaleY;
  const trimW = trimLayout.w * scaleX;
  const trimH = trimLayout.h * scaleY;

  offCtx.globalCompositeOperation = 'destination-out';
  offCtx.drawImage(trimMask, 0, 0, trimMask.width, trimMask.height, trimX, trimY, trimW, trimH);

  ctx.drawImage(off, bleedLayout.x, bleedLayout.y, bleedLayout.w, bleedLayout.h);
}

export function drawImageWithSampleMask(ctx, userImg, maskCanvas, layout, imgDraw) {
  const off = document.createElement('canvas');
  off.width = maskCanvas.width;
  off.height = maskCanvas.height;
  const offCtx = off.getContext('2d');

  const scaleX = off.width / layout.w;
  const scaleY = off.height / layout.h;
  const source = imgDraw || layout;
  const drawX = (source.x - layout.x) * scaleX;
  const drawY = (source.y - layout.y) * scaleY;
  const drawW = source.w * scaleX;
  const drawH = source.h * scaleY;

  offCtx.drawImage(userImg, drawX, drawY, drawW, drawH);
  offCtx.globalCompositeOperation = 'destination-in';
  offCtx.drawImage(maskCanvas, 0, 0);
  ctx.drawImage(off, layout.x, layout.y, layout.w, layout.h);
}

export const DIE_LINE_COLORS = {
  bleed: '#22d3ee',
  trim: '#ef4444'
};

export function drawBleedGuideLine(ctx, dieData, lineWidth = 2) {
  if (!dieData?.hasBleed || !dieData.bleedOuterGrid || !dieData.bleedLayout || !dieData.bleedGridSize) return;
  drawEdgeContour(
    ctx,
    dieData.bleedOuterGrid,
    dieData.bleedGridSize.width,
    dieData.bleedGridSize.height,
    dieData.bleedLayout.x,
    dieData.bleedLayout.y,
    DIE_LINE_COLORS.bleed,
    lineWidth
  );
}

export function drawDieLines(ctx, dieData, {
  strokeTrim = DIE_LINE_COLORS.trim,
  strokeBleed = DIE_LINE_COLORS.bleed,
  strokeInner = 'rgba(255,255,255,0.55)',
  lineWidth = 1.5,
  showBleedLine = true,
  showTrimLine = true
} = {}) {
  if (!dieData) return;

  const trimLayout = dieData.trimLayout || dieData.layout;
  const { gridSize } = dieData;

  if (showTrimLine) {
    if (dieData.trimOuterGrid && gridSize) {
      drawEdgeContour(
        ctx,
        dieData.trimOuterGrid,
        gridSize.width,
        gridSize.height,
        trimLayout.x,
        trimLayout.y,
        strokeTrim,
        lineWidth
      );
    } else if (dieData.outerGrid && gridSize) {
      drawEdgeContour(ctx, dieData.outerGrid, gridSize.width, gridSize.height, trimLayout.x, trimLayout.y, strokeTrim, lineWidth);
    } else if (dieData.outerPath) {
      ctx.save();
      ctx.strokeStyle = strokeTrim;
      ctx.lineWidth = lineWidth;
      ctx.stroke(dieData.outerPath);
      ctx.restore();
    }
  }

  if (dieData.hasBleed && showBleedLine && dieData.bleedOuterGrid && dieData.bleedLayout && dieData.bleedGridSize) {
    drawEdgeContour(
      ctx,
      dieData.bleedOuterGrid,
      dieData.bleedGridSize.width,
      dieData.bleedGridSize.height,
      dieData.bleedLayout.x,
      dieData.bleedLayout.y,
      strokeBleed,
      1.5
    );
  }

  if (dieData.innerGrid) {
    drawEdgeContour(
      ctx,
      dieData.innerGrid,
      gridSize.width,
      gridSize.height,
      trimLayout.x,
      trimLayout.y,
      strokeInner,
      Math.max(1, lineWidth - 0.25)
    );
  }
}

export function clearDieLineCache() {
  dieLineCache.clear();
  foilClipCache.clear();
}

function findPhotoClipSeed(opaque, width, height) {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  if (!opaque[cy * width + cx]) return { x: cx, y: cy };

  const maxRadius = Math.max(width, height);
  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        if (!opaque[y * width + x]) return { x, y };
      }
    }
  }
  return null;
}

function floodFillInterior(opaque, width, height, seed) {
  const filled = new Uint8Array(width * height);
  if (!seed) return filled;

  const queue = [seed];
  filled[seed.y * width + seed.x] = 1;

  while (queue.length > 0) {
    const { x, y } = queue.pop();
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 }
    ];
    for (const n of neighbors) {
      if (n.x < 0 || n.y < 0 || n.x >= width || n.y >= height) continue;
      const idx = n.y * width + n.x;
      if (filled[idx] || opaque[idx]) continue;
      filled[idx] = 1;
      queue.push(n);
    }
  }
  return filled;
}

function filledRegionToMaskCanvas(filled, width, height) {
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  const maskData = maskCtx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    if (filled[i]) maskData.data[i * 4 + 3] = 255;
  }
  maskCtx.putImageData(maskData, 0, 0);
  return maskCanvas;
}

function intersectMaskCanvases(primaryMask, secondaryMask) {
  const width = primaryMask.width;
  const height = primaryMask.height;
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  ctx.drawImage(primaryMask, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(secondaryMask, 0, 0);
  return out;
}

export function getFoilBorderClipData(foilBorderImg, layout, dieData, options = {}) {
  const { foilSrc = foilBorderImg.src } = options;
  const width = Math.max(1, Math.round(layout.w));
  const height = Math.max(1, Math.round(layout.h));
  const key = foilClipCacheKey(foilSrc, width, height);
  if (foilClipCache.has(key)) return foilClipCache.get(key);

  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const ctx = off.getContext('2d');
  ctx.drawImage(foilBorderImg, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  const opaque = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    opaque[i] = imageData.data[i * 4 + 3] >= 128 ? 1 : 0;
  }

  const seed = findPhotoClipSeed(opaque, width, height);
  const filled = floodFillInterior(opaque, width, height, seed);
  let photoClipMask = filledRegionToMaskCanvas(filled, width, height);

  if (dieData?.maskCanvas) {
    photoClipMask = intersectMaskCanvases(photoClipMask, dieData.maskCanvas);
  }

  const data = {
    photoClipMask,
    layout,
    renderOverlay: foilBorderHasRenderableArtwork(imageData)
  };
  foilClipCache.set(key, data);
  return data;
}

function foilBorderHasRenderableArtwork(imageData) {
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    if (a < 128) continue;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (r > 100 && g > 70 && b < 160 && r - b > 40) return true;
    if (Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && lum > 100 && lum < 235) return true;
  }
  return false;
}

import { MATERIALS, STANDARD_4CP_MATERIAL_ID, isStandard4cpMaterial } from '../config/pricing';

export function drawFoilBorderWithMaterial(ctx, foilBorderImg, layout, materialId) {
  if (isStandard4cpMaterial(materialId)) {
    ctx.drawImage(foilBorderImg, layout.x, layout.y, layout.w, layout.h);
    return;
  }

  const material = MATERIALS.find((m) => m.id === materialId) || MATERIALS[1];
  const w = Math.max(1, Math.round(layout.w));
  const h = Math.max(1, Math.round(layout.h));

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const offCtx = off.getContext('2d');

  offCtx.drawImage(foilBorderImg, 0, 0, w, h);
  offCtx.globalCompositeOperation = 'source-in';

  const gradient = offCtx.createLinearGradient(0, 0, w, h);
  if (material.overlayType === 'gradient') {
    if (material.id === 'digital-gold') {
      gradient.addColorStop(0, '#c9a227');
      gradient.addColorStop(0.45, '#f0dfa0');
      gradient.addColorStop(1, '#a67c00');
    } else {
      gradient.addColorStop(0, '#a8a8a8');
      gradient.addColorStop(0.45, '#e4e4e4');
      gradient.addColorStop(1, '#888888');
    }
  } else {
    material.stops.forEach((stop) => gradient.addColorStop(stop.offset, stop.color));
  }
  offCtx.fillStyle = gradient;
  offCtx.fillRect(0, 0, w, h);

  if (material.overlayType === 'metallic') {
    offCtx.globalCompositeOperation = 'source-atop';
    const highlight = offCtx.createLinearGradient(0, 0, w * 0.7, h * 0.5);
    highlight.addColorStop(0, 'rgba(255,255,255,0)');
    highlight.addColorStop(0.3, 'rgba(255,255,255,0.4)');
    highlight.addColorStop(0.55, 'rgba(255,255,255,0.08)');
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    offCtx.fillStyle = highlight;
    offCtx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(off, layout.x, layout.y, layout.w, layout.h);
}
