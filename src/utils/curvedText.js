function pathSegmentLength(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function buildPathMetrics(points) {
  const segments = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = pathSegmentLength(points[i], points[i + 1]);
    segments.push(len);
    total += len;
  }
  return { segments, total };
}

function pointAtDistance(points, segments, distance, uniformAngle = null) {
  if (points.length === 0) return null;
  if (points.length === 1) {
    return { ...points[0], angle: uniformAngle ?? 0 };
  }

  const total = segments.reduce((sum, len) => sum + len, 0);
  let remaining = Math.max(0, Math.min(distance, total));

  for (let i = 0; i < segments.length; i++) {
    const segLen = segments[i];
    if (remaining <= segLen || i === segments.length - 1) {
      const t = segLen === 0 ? 0 : remaining / segLen;
      const a = points[i];
      const b = points[i + 1];
      const angle =
        uniformAngle == null
          ? Math.atan2(b.y - a.y, b.x - a.x)
          : uniformAngle;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle
      };
    }
    remaining -= segLen;
  }

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  return {
    ...last,
    angle: uniformAngle ?? Math.atan2(last.y - prev.y, last.x - prev.x)
  };
}

export function mapShapePathToCanvas(pathPoints, labelLayout) {
  const centerX = labelLayout.x + labelLayout.w / 2;
  const centerY = labelLayout.y + labelLayout.h / 2;
  const unit = labelLayout.h / 100;
  return pathPoints.map(([lx, ly]) => ({
    x: centerX + lx * unit,
    y: centerY + ly * unit
  }));
}

/** Map 0–100 slider value to distance along path (0 = tip, 100 = toward loop). */
export function pathPositionToStartDistance(pathLength, textWidth, pathPosition = 50) {
  const travel = Math.max(0, pathLength - textWidth);
  const clamped = Math.max(0, Math.min(Number(pathPosition) || 0, 100));
  return (clamped / 100) * travel;
}

function measurePathText(ctx, chars, gap) {
  const charWidths = chars.map((char) => ctx.measureText(char).width);
  const textWidth =
    charWidths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, chars.length - 1);
  return { charWidths, textWidth };
}

export function drawTextAlongPath(ctx, text, canvasPoints, options = {}) {
  const {
    fontSize: requestedFontSize = 16,
    font = 'Josefin Sans',
    color = '#ffffff',
    pathPosition = 50,
    letterSpacing = 0,
    /** Keep every letter at the overall path angle (no kinks). */
    uniformAngle = true,
    /** Shrink text so it fits the path with room to slide. */
    autoFit = true,
    minFontSize = 9,
    fitRatio = 0.86
  } = options;

  if (!text?.trim() || canvasPoints.length < 2) {
    return { textWidth: 0, pathLength: 0, overflows: false, fontSize: requestedFontSize };
  }

  const { segments, total } = buildPathMetrics(canvasPoints);
  const first = canvasPoints[0];
  const last = canvasPoints[canvasPoints.length - 1];
  const pathAngle = Math.atan2(last.y - first.y, last.x - first.x);
  const angle = uniformAngle ? pathAngle : null;

  const chars = [...text];
  const gap = Number(letterSpacing) || 0;

  let fontSize = requestedFontSize;
  ctx.save();
  ctx.font = `${fontSize}px "${font}", sans-serif`;
  let { charWidths, textWidth } = measurePathText(ctx, chars, gap);

  if (autoFit && total > 0 && textWidth > total * fitRatio) {
    const scaled = Math.max(minFontSize, fontSize * ((total * fitRatio) / textWidth));
    if (scaled < fontSize - 0.25) {
      fontSize = scaled;
      ctx.font = `${fontSize}px "${font}", sans-serif`;
      ({ charWidths, textWidth } = measurePathText(ctx, chars, gap));
    }
  }

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const startDistance = pathPositionToStartDistance(total, textWidth, pathPosition);
  let cursor = startDistance;

  chars.forEach((char, index) => {
    const charWidth = charWidths[index];
    const placement = pointAtDistance(
      canvasPoints,
      segments,
      cursor + charWidth / 2,
      angle
    );
    if (!placement) return;

    ctx.save();
    ctx.translate(placement.x, placement.y);
    ctx.rotate(placement.angle);
    ctx.fillText(char, 0, 0);
    ctx.restore();

    cursor += charWidth + gap;
  });

  ctx.restore();
  return {
    textWidth,
    pathLength: total,
    overflows: textWidth > total,
    fontSize
  };
}
