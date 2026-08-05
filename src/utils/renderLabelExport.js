import { SHAPES, shapeHasFoilBorder, shapeIsTextOnly, shapeHasBleedAssets, getShapePrintSizeInches } from '../config/shapes';
import {
  computeSampleLabelLayout,
  drawFoilBorderWithMaterial,
  drawImageWithSampleMask,
  getBleedDieLineData,
  getDieLineData,
  getFoilBorderClipData,
  drawBleedInteriorBlack,
  drawDieLines,
  DIE_LINE_COLORS
} from '../utils/labelDieLines';
import { drawTextAlongPath, mapShapePathToCanvas } from '../utils/curvedText';
import { drawTintedRibbon } from '../utils/ribbonTint';
import { getRibbonColor } from '../config/ribbonColors';
import { isFullBleedMaterial } from '../config/pricing';
import { resolveUploadedPhotoPlacement, computeImageDraw, shouldDrawFoilBlackBase } from '../utils/renderLabelPhoto';

const PREVIEW_LOGICAL_SIZE = 600;
const PREVIEW_MAX_TARGET = 420;

export { PREVIEW_LOGICAL_SIZE, PREVIEW_MAX_TARGET };

export function normalizeLayoutBounds(bounds) {
  if (!bounds) return null;
  if ('width' in bounds) {
    return { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height };
  }
  return { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };
}

export function cropCanvasToBounds(sourceCanvas, bounds) {
  const { x, y, w, h } = normalizeLayoutBounds(bounds);
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.min(Math.ceil(w), sourceCanvas.width - sx);
  const sh = Math.min(Math.ceil(h), sourceCanvas.height - sy);
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  canvas.getContext('2d').drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

/** Map export canvas pixels to physical mm; width/height each tied to trim inches. */
export function computePdfLabelDrawSizeMm(exportBounds, trimLayout, shapeOrId) {
  const trimIn = getShapePrintSizeInches(shapeOrId);

  if (!exportBounds?.w || !exportBounds?.h || !trimLayout?.w || !trimLayout?.h) {
    return { width: trimIn.width * 25.4, height: trimIn.height * 25.4 };
  }

  const bleedScaleW = exportBounds.w / trimLayout.w;
  const bleedScaleH = exportBounds.h / trimLayout.h;

  return {
    width: trimIn.width * bleedScaleW * 25.4,
    height: trimIn.height * bleedScaleH * 25.4
  };
}

export function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read uploaded image file.'));
    reader.readAsDataURL(blob);
  });
}

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
  return loadImageFromSrc(dataUrl).then((img) => {
    if (!img.naturalWidth || !img.naturalHeight) {
      throw new Error('Saved upload image failed to decode.');
    }
    return img;
  });
}

export function imageElementToDataUrl(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export function cloneCanvas(source) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext('2d').drawImage(source, 0, 0);
  return canvas;
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
 * Build shared label state through photo + black base (used for customer & designer copies).
 */
async function buildLabelExportState(item, options = {}) {
  const {
    logicalSize = PREVIEW_LOGICAL_SIZE * 2,
    scaleFactor = logicalSize / PREVIEW_LOGICAL_SIZE
  } = options;

  const maxTargetSize = PREVIEW_MAX_TARGET * scaleFactor;
  const shape = SHAPES.find((s) => s.id === item.shape) || SHAPES[0];
  const isTextOnlyShape = shapeIsTextOnly(shape);
  const textSegments = item.textSegments || [];
  const imageOffset = item.imageOffset || { x: 0, y: 0 };
  const imageScale = item.imageScale ?? 1;
  const uvEnabled = Boolean(item.uvEnabled);
  const ribbonColorId = item.ribbonColorId;

  const assets = await loadShapeAssets(shape);
  let uploadedImage = null;
  if (item.imageDataUrl) {
    uploadedImage = await loadImageFromDataUrl(item.imageDataUrl);
  }

  if (!isTextOnlyShape) {
    if (!item.imageDataUrl) {
      throw new Error('This label is missing the saved upload image.');
    }
    if (!uploadedImage) {
      throw new Error('Could not load the saved upload image for this label.');
    }
  }

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

  const usesBleedDieLines = shapeHasBleedAssets(shape) && Boolean(bleedImage && dieLineImage);
  const usesSampleDieLines = Boolean(uploadedImage && sampleImage);
  const hasFoilBorder = shapeHasFoilBorder(shape) && Boolean(foilBorderImage);
  const customerMaterialId = item.material || 'standard-4cp';
  const customerFullBleed = isFullBleedMaterial(customerMaterialId);
  const showFoilBorder = hasFoilBorder && !customerFullBleed;

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

  if (shapeHasBleedAssets(shape)) {
    if (!bleedImage || !dieLineImage) {
      throw new Error(`Missing bleed assets for "${shape.id}".`);
    }
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
    if (hasFoilBorder && !customerFullBleed) {
      foilClipData = getFoilBorderClipData(foilBorderImage, trimLayout, dieData, {
        foilSrc: shape.foilBorderImage
      });
    }
  } else if (labelLayout && sampleImage) {
    if (usesSampleDieLines || usesBleedDieLines) {
      if (!usesBleedDieLines) {
        dieData = getDieLineData(sampleImage, labelLayout, {
          drawInnerDieLine: shape.dieLines?.inner !== false,
          innerInsetRatio: shape.dieLines?.innerInsetRatio ?? 0.034,
          sampleSrc: shape.sampleImage
        });
      }
    } else {
      dieData = getDieLineData(sampleImage, labelLayout, {
        drawInnerDieLine: false,
        sampleSrc: shape.sampleImage
      });
    }
    if (hasFoilBorder && !customerFullBleed && dieData) {
      foilClipData = getFoilBorderClipData(foilBorderImage, labelLayout, dieData, {
        foilSrc: shape.foilBorderImage
      });
    }
  }

  const activeImg = isTextOnlyShape ? sampleImage : uploadedImage;
  const isSampleLabel = !isTextOnlyShape && !uploadedImage && sampleImage && !shape.clipSampleToShape;
  let imgDraw = null;

  const photoPlacement = uploadedImage
    ? resolveUploadedPhotoPlacement({
      shape,
      dieData,
      bleedLayoutRef,
      labelLayout,
      foilClipData,
      uploadedImage,
      hasFoilBorder,
      fullBleed: customerFullBleed
    })
    : null;

  if (activeImg) {
    if (uploadedImage && photoPlacement) {
      imgDraw = computeImageDraw(activeImg, {
        bounds: photoPlacement.bounds,
        coverFit: photoPlacement.coverFit,
        imageScale,
        imageOffset,
        scaleFactor,
        uploadedImage: true
      });
    } else if (isSampleLabel || usesSampleDieLines || usesBleedDieLines) {
      const imgW = activeImg.naturalWidth || activeImg.width;
      const imgH = activeImg.naturalHeight || activeImg.height;
      const imgRatio = imgW / imgH;
      const bounds = labelLayout;
      if (!bounds) {
        throw new Error(`Could not compute label layout for shape "${shape.id}".`);
      }
      const boundsRatio = bounds.w / bounds.h;
      let drawW;
      let drawH;

      if (imgRatio > boundsRatio) {
        drawH = bounds.h;
        drawW = drawH * imgRatio;
      } else {
        drawW = bounds.w;
        drawH = drawW / imgRatio;
      }

      imgDraw = {
        x: bounds.x + (bounds.w - drawW) / 2,
        y: bounds.y + (bounds.h - drawH) / 2,
        w: drawW,
        h: drawH
      };
    } else {
      const imgW = activeImg.naturalWidth || activeImg.width;
      const imgH = activeImg.naturalHeight || activeImg.height;
      const imgRatio = imgW / imgH;
      const rectRatio = rect.width / rect.height;
      let drawW;
      let drawH;

      if (imgRatio > rectRatio) {
        drawH = rect.height;
        drawW = drawH * imgRatio;
      } else {
        drawW = rect.width;
        drawH = drawW / imgRatio;
      }

      imgDraw = {
        x: rect.x + (rect.width - drawW) / 2,
        y: rect.y + (rect.height - drawH) / 2,
        w: drawW,
        h: drawH
      };
    }
  }

  const overlayRect = trimLayout
    ? { x: trimLayout.x, y: trimLayout.y, width: trimLayout.w, height: trimLayout.h }
    : rect;

  const useFoilBlackBase = shouldDrawFoilBlackBase({
    dieData,
    bleedLayoutRef,
    hasFoilBorder,
    fullBleed: customerFullBleed,
    uploadedImage
  });

  ctx.fillStyle = useFoilBlackBase ? '#000000' : '#ffffff';
  ctx.fillRect(0, 0, logicalSize, logicalSize);

  if (useFoilBlackBase) {
    drawBleedInteriorBlack(ctx, dieData, bleedLayoutRef);
  }

  if (activeImg && imgDraw) {
    if ((usesSampleDieLines || usesBleedDieLines) && dieData && (uploadedImage || isTextOnlyShape)) {
      if (isTextOnlyShape) {
        const ribbonColor = getRibbonColor(ribbonColorId);
        drawTintedRibbon(ctx, activeImg, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h, ribbonColor.color, ribbonColor.id);
        const clipMask = dieData.maskCanvas;
        const clipLayout = labelLayout;
        if (clipMask && clipLayout) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-in';
          ctx.drawImage(clipMask, clipLayout.x, clipLayout.y, clipLayout.w, clipLayout.h);
          ctx.restore();
        }
      } else if (photoPlacement) {
        drawImageWithSampleMask(
          ctx,
          uploadedImage,
          photoPlacement.clipMask,
          photoPlacement.clipLayout,
          imgDraw
        );
      } else if (dieData?.maskCanvas) {
        drawImageWithSampleMask(ctx, uploadedImage, dieData.maskCanvas, labelLayout, imgDraw);
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

  const exportMeta = {
    exportBounds: normalizeLayoutBounds(
      dieData?.hasBleed && bleedLayoutRef ? bleedLayoutRef : (trimLayout || rect)
    ),
    trimLayout: normalizeLayoutBounds(trimLayout || rect),
    bleedLayout: normalizeLayoutBounds(bleedLayoutRef)
  };

  return {
    ctx,
    canvas,
    exportMeta,
    overlayRect,
    center,
    scaleFactor,
    shape,
    isTextOnlyShape,
    labelLayout,
    imgDraw,
    showFoilBorder,
    materialId: customerMaterialId,
    uvEnabled,
    textSegments,
    foilBorderImageAsset: foilBorderImage,
    dieData,
    usesSampleDieLines,
    usesBleedDieLines
  };
}

function drawExportDieLines(ctx, state) {
  if (!state.dieData) return;
  drawDieLines(ctx, state.dieData, {
    strokeTrim: DIE_LINE_COLORS.trim,
    showTrimLine: true,
    showBleedLine: false,
    lineWidth: 1.5 * state.scaleFactor
  });
}

function drawExportEmbellishments(ctx, state, { includeFoil, includeUv, includeDieLine }) {
  if (includeFoil && state.showFoilBorder && state.labelLayout && state.foilBorderImageAsset) {
    drawFoilBorderWithMaterial(ctx, state.foilBorderImageAsset, state.labelLayout, state.materialId);
  }
  if (includeUv && state.uvEnabled) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(state.overlayRect.x, state.overlayRect.y, state.overlayRect.width, state.overlayRect.height);
    ctx.restore();
  }
  if (includeDieLine) {
    drawExportDieLines(ctx, state);
  }
}

function drawExportText(ctx, state) {
  const { textSegments, scaleFactor, center, overlayRect, shape, isTextOnlyShape, labelLayout, imgDraw } = state;
  const activeSegments = textSegments.filter((s) => s?.text?.trim());
  if (activeSegments.length === 0) return;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4 * scaleFactor;
  ctx.shadowOffsetX = scaleFactor;
  ctx.shadowOffsetY = scaleFactor;

  if (isTextOnlyShape && shape.textPath?.length && (imgDraw || labelLayout)) {
    const pathLayout = imgDraw
      ? { x: imgDraw.x, y: imgDraw.y, w: imgDraw.w, h: imgDraw.h }
      : labelLayout;
    const canvasPath = mapShapePathToCanvas(shape.textPath, pathLayout);
    activeSegments.forEach((segment) => {
      drawTextAlongPath(ctx, segment.text.toUpperCase(), canvasPath, {
        fontSize: segment.fontSize * scaleFactor,
        font: segment.font || 'Josefin Sans',
        color: segment.color || '#ffffff',
        pathPosition: segment.pathPosition ?? shape.defaultPathPosition ?? 28,
        letterSpacing: Math.max(0, segment.fontSize * scaleFactor * 0.02),
        uniformAngle: true,
        autoFit: true,
        minFontSize: 9 * scaleFactor
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

function finalizeExportCanvas(state, { includeFoil, includeUv, includeDieLine }) {
  const canvas = cloneCanvas(state.canvas);
  const ctx = canvas.getContext('2d');
  drawExportEmbellishments(ctx, state, { includeFoil, includeUv, includeDieLine });
  drawExportText(ctx, state);
  return {
    canvas,
    ...state.exportMeta
  };
}

/**
 * Render customer + designer canvases from one shared photo/base pass so placement is identical.
 */
export async function renderLabelExportCanvasPair(item, options = {}) {
  const state = await buildLabelExportState(item, options);
  const customer = finalizeExportCanvas(state, { includeFoil: true, includeUv: true, includeDieLine: true });
  const designer = finalizeExportCanvas(state, { includeFoil: false, includeUv: false, includeDieLine: false });
  return { customer, designer };
}

/** Crop + encode both print copies at cart-add time so PDF export uses frozen pixels. */
export async function capturePrintSnapshots(cartItem, options = {}) {
  const { customer, designer } = await renderLabelExportCanvasPair(cartItem, options);
  const exportBounds = customer.exportBounds;
  const customerCrop = cropCanvasToBounds(customer.canvas, exportBounds);
  const designerCrop = cropCanvasToBounds(designer.canvas, exportBounds);
  return {
    customerPrintDataUrl: customerCrop.toDataURL('image/png'),
    designerPrintDataUrl: designerCrop.toDataURL('image/png'),
    printExportBounds: exportBounds,
    printTrimLayout: customer.trimLayout
  };
}

/**
 * Render a print-ready label (bleed included, no die-line guides) to a canvas.
 */
export async function renderLabelExportCanvas(item, options = {}) {
  const { noEmbellishments = false } = options;
  const { customer, designer } = await renderLabelExportCanvasPair(item, options);
  return noEmbellishments ? designer : customer;
}
