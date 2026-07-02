import { SHAPES, shapeHasFoilBorder, shapeIsTextOnly, shapeHasBleedAssets } from '../config/shapes';
import {
  computeSampleLabelLayout,
  drawFoilBorderWithMaterial,
  drawImageWithSampleMask,
  getBleedDieLineData,
  getDieLineData,
  getFoilBorderClipData
} from '../utils/labelDieLines';
import { drawTextAlongPath, mapShapePathToCanvas } from '../utils/curvedText';
import { drawTintedRibbon } from '../utils/ribbonTint';
import { getRibbonColor } from '../config/ribbonColors';
import { isFullBleedMaterial } from '../config/pricing';

const PREVIEW_LOGICAL_SIZE = 600;
const PREVIEW_MAX_TARGET = 420;

export function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function loadImageFromDataUrl(dataUrl) {
  if (!dataUrl) return Promise.resolve(null);
  return loadImageFromSrc(dataUrl);
}

export function imageElementToDataUrl(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

async function loadShapeAssets(shape) {
  const [sampleImage, foilBorderImage, dieLineImage, bleedImage] = await Promise.all([
    shape.sampleImage ? loadImageFromSrc(shape.sampleImage) : null,
    shape.foilBorderImage ? loadImageFromSrc(shape.foilBorderImage) : null,
    shape.dieLineImage ? loadImageFromSrc(shape.dieLineImage) : null,
    shape.bleedImage ? loadImageFromSrc(shape.bleedImage) : null
  ]);
  return { sampleImage, foilBorderImage, dieLineImage, bleedImage };
}

/**
 * Render a print-ready label (bleed included, no die-line guides) to a canvas.
 */
export async function renderLabelExportCanvas(item, options = {}) {
  const {
    logicalSize = PREVIEW_LOGICAL_SIZE * 2,
    scaleFactor = logicalSize / PREVIEW_LOGICAL_SIZE
  } = options;

  const maxTargetSize = PREVIEW_MAX_TARGET * scaleFactor;
  const shape = SHAPES.find((s) => s.id === item.shape) || SHAPES[0];
  const materialId = item.material || 'standard-4cp';
  const textSegments = item.textSegments || [];
  const imageOffset = item.imageOffset || { x: 0, y: 0 };
  const scaledOffset = {
    x: imageOffset.x * scaleFactor,
    y: imageOffset.y * scaleFactor
  };
  const uvEnabled = Boolean(item.uvEnabled);
  const ribbonColorId = item.ribbonColorId;

  const assets = await loadShapeAssets(shape);
  let uploadedImage = await loadImageFromDataUrl(item.imageDataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = logicalSize;
  canvas.height = logicalSize;
  const ctx = canvas.getContext('2d');

  const { sampleImage, foilBorderImage, dieLineImage, bleedImage } = assets;
  const shapeMaxDimension = Math.max(shape.viewBoxWidth, shape.viewBoxHeight);
  const shapeScale = maxTargetSize / shapeMaxDimension;
  const rectWidth = shape.viewBoxWidth * shapeScale;
  const rectHeight = shape.viewBoxHeight * shapeScale;
  const rect = {
    x: 300 * scaleFactor - rectWidth / 2,
    y: 300 * scaleFactor - rectHeight / 2,
    width: rectWidth,
    height: rectHeight
  };
  const center = 300 * scaleFactor;

  const defineShapePath = () => {
    if (shape.pathType === 'path2d') return new Path2D(shape.path);
    const p = new Path2D();
    if (shape.pathType === 'circle') {
      p.arc(0, 0, 46, 0, Math.PI * 2);
      return p;
    }
    if (shape.pathType === 'roundRect') {
      const [x, y, w, h, rRaw] = shape.rectParams;
      const r = Math.max(0, Math.min(Math.abs(rRaw || 0), Math.min(w / 2, h / 2)));
      p.moveTo(x + r, y);
      p.lineTo(x + w - r, y);
      p.arcTo(x + w, y, x + w, y + r, r);
      p.lineTo(x + w, y + h - r);
      p.arcTo(x + w, y + h, x + w - r, y + h, r);
      p.lineTo(x + r, y + h);
      p.arcTo(x, y + h, x, y + h - r, r);
      p.lineTo(x, y + r);
      p.arcTo(x, y, x + r, y, r);
      p.closePath();
      return p;
    }
    return p;
  };

  const applyShapeTransform = (context) => {
    context.translate(center, center);
    context.scale(shapeScale, shapeScale);
  };

  const isTextOnlyShape = shapeIsTextOnly(shape);
  const usesBleedDieLines = shapeHasBleedAssets(shape) && Boolean(bleedImage && dieLineImage);
  const hasFoilBorder = shapeHasFoilBorder(shape) && Boolean(foilBorderImage);
  const fullBleed = isFullBleedMaterial(materialId);
  const showFoilBorder = hasFoilBorder && !fullBleed;
  const forceBleedClip = usesBleedDieLines && Boolean(uploadedImage || isTextOnlyShape);

  let labelLayout = sampleImage
    ? computeSampleLabelLayout(sampleImage, maxTargetSize)
    : null;

  // computeSampleLabelLayout uses hardcoded 300 center — patch layouts for export scale
  const recenterLayout = (layout) => {
    if (!layout) return layout;
    return {
      ...layout,
      x: center - layout.w / 2,
      y: center - layout.h / 2
    };
  };

  if (labelLayout) labelLayout = recenterLayout(labelLayout);

  let trimLayout = labelLayout;
  let bleedLayoutRef = null;
  let dieData = null;
  let foilClipData = null;

  if (usesBleedDieLines) {
    dieData = getBleedDieLineData(bleedImage, dieLineImage, maxTargetSize);
    bleedLayoutRef = recenterLayout(dieData.bleedLayout);
    trimLayout = recenterLayout(dieData.trimLayout);
    labelLayout = trimLayout;
    dieData = {
      ...dieData,
      bleedLayout: bleedLayoutRef,
      trimLayout,
      layout: bleedLayoutRef
    };
    if (hasFoilBorder && !fullBleed) {
      foilClipData = getFoilBorderClipData(foilBorderImage, trimLayout, dieData, {
        foilSrc: shape.foilBorderImage
      });
    }
  } else if (labelLayout && sampleImage) {
    dieData = getDieLineData(sampleImage, labelLayout, {
      drawInnerDieLine: false,
      sampleSrc: shape.sampleImage
    });
    if (hasFoilBorder && !fullBleed) {
      foilClipData = getFoilBorderClipData(foilBorderImage, labelLayout, dieData, {
        foilSrc: shape.foilBorderImage
      });
    }
  }

  const activeImg = uploadedImage || sampleImage;
  const isSampleLabel = !uploadedImage && sampleImage && !shape.clipSampleToShape;
  let imgDraw = null;

  if (activeImg) {
    const imgW = activeImg.width;
    const imgH = activeImg.height;
    const imgRatio = imgW / imgH;
    const bounds = forceBleedClip && bleedLayoutRef ? bleedLayoutRef : labelLayout;
    if (!bounds) {
      throw new Error(`Could not compute label layout for shape "${shape.id}".`);
    }
    const boundsRatio = bounds.w / bounds.h;
    let drawW;
    let drawH;

    if (forceBleedClip) {
      if (imgRatio > boundsRatio) {
        drawH = bounds.h;
        drawW = drawH * imgRatio;
      } else {
        drawW = bounds.w;
        drawH = drawW / imgRatio;
      }
    } else if (imgRatio > boundsRatio) {
      drawH = bounds.h;
      drawW = drawH * imgRatio;
    } else {
      drawW = bounds.w;
      drawH = drawW / imgRatio;
    }

    const finalX = bounds.x + (bounds.w - drawW) / 2 + (uploadedImage ? scaledOffset.x : 0);
    const finalY = bounds.y + (bounds.h - drawH) / 2 + (uploadedImage ? scaledOffset.y : 0);
    imgDraw = { x: finalX, y: finalY, w: drawW, h: drawH };
  }

  const overlayRect = trimLayout
    ? { x: trimLayout.x, y: trimLayout.y, width: trimLayout.w, height: trimLayout.h }
    : rect;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, logicalSize, logicalSize);

  if (activeImg && imgDraw) {
    if (usesBleedDieLines && dieData && (uploadedImage || isTextOnlyShape)) {
      const clipMask = forceBleedClip
        ? (dieData.bleedMaskCanvas || dieData.maskCanvas)
        : (foilClipData?.photoClipMask || dieData.maskCanvas);
      const clipLayout = forceBleedClip && dieData.hasBleed ? bleedLayoutRef : labelLayout;
      if (isTextOnlyShape) {
        const ribbonColor = getRibbonColor(ribbonColorId);
        drawTintedRibbon(ctx, activeImg, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h, ribbonColor.color, ribbonColor.id);
        if (clipMask && clipLayout) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-in';
          ctx.drawImage(clipMask, clipLayout.x, clipLayout.y, clipLayout.w, clipLayout.h);
          ctx.restore();
        }
      } else {
        drawImageWithSampleMask(ctx, activeImg, clipMask, clipLayout, imgDraw);
      }
    } else if (isSampleLabel) {
      ctx.drawImage(activeImg, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h);
    } else {
      ctx.save();
      applyShapeTransform(ctx);
      ctx.clip(defineShapePath());
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(activeImg, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h);
      ctx.restore();
    }
  }

  if (showFoilBorder && labelLayout) {
    drawFoilBorderWithMaterial(ctx, foilBorderImage, labelLayout, materialId);
  }

  if (uvEnabled) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(overlayRect.x, overlayRect.y, overlayRect.width, overlayRect.height);
    ctx.restore();
  }

  const activeSegments = textSegments.filter((s) => s?.text?.trim());
  if (activeSegments.length > 0) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4 * scaleFactor;
    ctx.shadowOffsetX = scaleFactor;
    ctx.shadowOffsetY = scaleFactor;

    if (isTextOnlyShape && shape.textPath?.length && labelLayout) {
      const canvasPath = mapShapePathToCanvas(shape.textPath, labelLayout);
      activeSegments.forEach((segment) => {
        drawTextAlongPath(ctx, segment.text.toUpperCase(), canvasPath, {
          fontSize: segment.fontSize * scaleFactor,
          font: segment.font || 'Josefin Sans',
          color: segment.color || '#ffffff',
          pathPosition: segment.pathPosition ?? shape.defaultPathPosition ?? 42
        });
      });
    } else {
      let baseTextCenterY = overlayRect.y + overlayRect.height * 0.75;
      if (shape.id === 'template_page_10_crest_wave') {
        baseTextCenterY = overlayRect.y + overlayRect.height * 0.5;
      }
      const totalTextHeight = activeSegments.reduce((acc, seg) => acc + seg.fontSize * 1.3 * scaleFactor, 0);
      let currentY = baseTextCenterY - totalTextHeight / 2;

      activeSegments.forEach((segment) => {
        const fontName = segment.font || 'Playfair Display';
        const fontSize = segment.fontSize * scaleFactor;
        ctx.font = `${fontSize}px "${fontName}", serif`;
        ctx.fillStyle = segment.color || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const segOffset = segment.offset || { x: 0, y: 0 };
        const lineY = currentY + segOffset.y * scaleFactor;
        const lineX = center + segOffset.x * scaleFactor;

        const padding = 24 * scaleFactor;
        const availableWidth = overlayRect.width - padding;
        let currentFontSize = fontSize;
        ctx.font = `${currentFontSize}px "${fontName}", serif`;
        let metrics = ctx.measureText(segment.text);
        if (metrics.width > availableWidth) {
          const scale = availableWidth / metrics.width;
          currentFontSize = Math.max(8 * scaleFactor, Math.floor(currentFontSize * scale));
          ctx.font = `${currentFontSize}px "${fontName}", serif`;
        }

        ctx.fillText(segment.text, lineX, lineY);
        currentY += currentFontSize * 1.3;
      });
    }
    ctx.restore();
  }

  return canvas;
}
