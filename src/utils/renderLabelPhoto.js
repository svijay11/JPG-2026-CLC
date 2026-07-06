import { shapeHasBleedAssets } from '../config/shapes';

/**
 * Resolve bounds + clip for uploaded photos (preview + PDF export).
 * Foil-border labels (standard finish): photo stays inside the frame window.
 * Full bleed / designer print: photo extends to the bleed edge.
 */
export function resolveUploadedPhotoPlacement({
  shape,
  dieData,
  bleedLayoutRef,
  labelLayout,
  foilClipData,
  uploadedImage,
  hasFoilBorder,
  fullBleed
}) {
  const hasBleed = Boolean(dieData?.hasBleed && bleedLayoutRef);
  const useFoilPhotoClip = Boolean(hasFoilBorder && !fullBleed && foilClipData?.photoClipMask);

  if (useFoilPhotoClip) {
    return {
      bounds: labelLayout,
      coverFit: false,
      clipMask: foilClipData.photoClipMask,
      clipLayout: labelLayout
    };
  }

  const useBleedClip = Boolean(
    hasBleed &&
    uploadedImage &&
    (fullBleed || (shapeHasBleedAssets(shape) && !hasFoilBorder))
  );

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

  return {
    bounds: labelLayout,
    coverFit: false,
    clipMask: dieData?.maskCanvas,
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

  const imgW = activeImg.naturalWidth || activeImg.width;
  const imgH = activeImg.naturalHeight || activeImg.height;
  const imgRatio = imgW / imgH;
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

/** Foil-border labels: black fill inside bleed (trim area + margin + gaps under foil art). */
export function shouldDrawFoilBlackBase({
  dieData,
  bleedLayoutRef,
  hasFoilBorder,
  fullBleed,
  uploadedImage
}) {
  return Boolean(
    dieData?.hasBleed &&
    bleedLayoutRef &&
    uploadedImage &&
    hasFoilBorder &&
    !fullBleed
  );
}

/** @deprecated Use shouldDrawFoilBlackBase */
export function shouldDrawBleedMarginBlack(props) {
  return shouldDrawFoilBlackBase(props);
}
