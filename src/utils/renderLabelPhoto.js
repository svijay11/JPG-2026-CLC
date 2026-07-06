import { shapeHasBleedAssets } from '../config/shapes';

/**
 * Resolve bounds + clip for uploaded photos (preview + PDF export).
 * Bleed shapes must use bleedMaskCanvas with bleedLayout — never trim mask at bleed size.
 */
export function resolveUploadedPhotoPlacement({
  shape,
  dieData,
  bleedLayoutRef,
  labelLayout,
  foilClipData,
  uploadedImage,
  noEmbellishments,
  hasFoilBorder,
  fullBleed
}) {
  const hasBleed = Boolean(dieData?.hasBleed && bleedLayoutRef);
  const useBleedClip = Boolean(hasBleed && uploadedImage && (noEmbellishments || shapeHasBleedAssets(shape)));

  if (useBleedClip) {
    const clipMask = dieData.bleedMaskCanvas;
    if (!clipMask) {
      throw new Error(`Bleed mask is missing for "${shape.id}".`);
    }
    return {
      bounds: bleedLayoutRef,
      coverFit: true,
      clipMask,
      clipLayout: bleedLayoutRef
    };
  }

  const useFoilPhotoClip = Boolean(hasFoilBorder && !fullBleed && foilClipData?.photoClipMask);
  return {
    bounds: labelLayout,
    coverFit: false,
    clipMask: useFoilPhotoClip ? foilClipData.photoClipMask : dieData?.maskCanvas,
    clipLayout: labelLayout
  };
}

export function computeImageDraw(activeImg, {
  bounds,
  coverFit,
  imageScale = 1,
  imageOffset = { x: 0, y: 0 },
  scaleFactor = 1,
  uploadedImage = true
}) {
  if (!activeImg || !bounds) return null;

  const imgRatio = activeImg.width / activeImg.height;
  const boundsRatio = bounds.w / bounds.h;
  let drawW;
  let drawH;

  if (coverFit) {
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

  const scaledScale = uploadedImage ? imageScale : 1;
  const scaledOffset = {
    x: (imageOffset?.x || 0) * scaleFactor,
    y: (imageOffset?.y || 0) * scaleFactor
  };

  const finalW = drawW * scaledScale;
  const finalH = drawH * scaledScale;
  const finalX = bounds.x + (bounds.w - finalW) / 2 + (uploadedImage ? scaledOffset.x : 0);
  const finalY = bounds.y + (bounds.h - finalH) / 2 + (uploadedImage ? scaledOffset.y : 0);

  return { x: finalX, y: finalY, w: finalW, h: finalH };
}
