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

function pointAtDistance(points, segments, distance) {
  if (points.length === 0) return null;
  if (points.length === 1) return { ...points[0], angle: 0 };

  let remaining = Math.max(0, Math.min(distance, segments.reduce((a, b) => a + b, 0)));
  for (let i = 0; i < segments.length; i++) {
    const segLen = segments[i];
    if (remaining <= segLen || i === segments.length - 1) {
      const t = segLen === 0 ? 0 : remaining / segLen;
      const a = points[i];
      const b = points[i + 1];
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: Math.atan2(b.y - a.y, b.x - a.x)
      };
    }
    remaining -= segLen;
  }
  const last = points[points.length - 1];
  return { ...last, angle: 0 };
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

/** Map 0–100 slider value to distance along path (0 = start, 100 = end). */
export function pathPositionToStartDistance(pathLength, textWidth, pathPosition = 50) {
  const travel = Math.max(0, pathLength - textWidth);
  const clamped = Math.max(0, Math.min(Number(pathPosition) || 0, 100));
  return (clamped / 100) * travel;
}

export function drawTextAlongPath(ctx, text, canvasPoints, options = {}) {
  const {
    fontSize = 16,
    font = 'Josefin Sans',
    color = '#ffffff',
    pathPosition = 50
  } = options;

  if (!text?.trim() || canvasPoints.length < 2) {
    return { textWidth: 0, pathLength: 0, overflows: false };
  }

  ctx.save();
  ctx.font = `${fontSize}px "${font}", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = [...text];
  const charWidths = chars.map((char) => ctx.measureText(char).width);
  const textWidth = charWidths.reduce((sum, width) => sum + width, 0);
  const { segments, total } = buildPathMetrics(canvasPoints);
  const startDistance = pathPositionToStartDistance(total, textWidth, pathPosition);
  let cursor = startDistance;

  chars.forEach((char, index) => {
    const charWidth = charWidths[index];
    const placement = pointAtDistance(canvasPoints, segments, cursor + charWidth / 2);
    if (!placement) return;

    ctx.save();
    ctx.translate(placement.x, placement.y);
    ctx.rotate(placement.angle);
    ctx.fillText(char, 0, 0);
    ctx.restore();

    cursor += charWidth;
  });

  ctx.restore();
  return { textWidth, pathLength: total, overflows: textWidth > total };
}
