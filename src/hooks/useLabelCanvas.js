import { useEffect, useState } from 'react';
import { SHAPES, shapeHasFoilBorder, shapeIsTextOnly, shapeHasBleedAssets } from '../config/shapes';
import {
  computeSampleLabelLayout,
  drawDieLines,
  drawFoilBorderWithMaterial,
  drawImageWithSampleMask,
  getBleedDieLineData,
  getDieLineData,
  getFoilBorderClipData,
  DIE_LINE_COLORS,
  drawBleedGuideLine,
  drawBleedInteriorBlack
} from '../utils/labelDieLines';
import { drawTintedRibbon } from '../utils/ribbonTint';
import { getRibbonColor } from '../config/ribbonColors';
import { isFullBleedMaterial } from '../config/pricing';
import { resolveUploadedPhotoPlacement, computeImageDraw, shouldDrawFoilBlackBase } from '../utils/renderLabelPhoto';

export const useLabelCanvas = (canvasRef, {
  selectedShape,
  selectedMaterial,
  uploadedImage,
  sampleImage,
  foilBorderImage,
  dieLineImage,
  bleedImage,
  imageOffset,
  imageScale = 1,
  textSegments,
  repositionMode,
  ribbonColorId,
  uvEnabled,
  setHasTextOverflow
}) => {
  const [fontsLoaded, setFontsLoaded] = useState(0);

  // Monitor font loading to trigger re-renders when Google Fonts finish downloading
  useEffect(() => {
    const handleFontsLoaded = () => {
      setFontsLoaded((prev) => prev + 1);
    };
    document.fonts.addEventListener('loadingdone', handleFontsLoaded);
    
    // Also check on mount/load
    document.fonts.ready.then(() => {
      setFontsLoaded((prev) => prev + 1);
    });

    return () => {
      document.fonts.removeEventListener('loadingdone', handleFontsLoaded);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use High-DPI rendering (2x scaling for retina screens)
    const dpr = 2;
    const logicalSize = 600;
    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;
    canvas.style.width = `${logicalSize}px`;
    canvas.style.height = `${logicalSize}px`;

    // Scale canvas to logical size
    ctx.scale(dpr, dpr);

    // Find active shape config
    const shape = SHAPES.find((s) => s.id === selectedShape) || SHAPES[0];
    
    // Calculate the label bounding box centered on the 600x600 canvas
    const maxTargetSize = 420;
    const shapeMaxDimension = Math.max(shape.viewBoxWidth, shape.viewBoxHeight);
    const shapeScale = maxTargetSize / shapeMaxDimension;
    const rectWidth = shape.viewBoxWidth * shapeScale;
    const rectHeight = shape.viewBoxHeight * shapeScale;
    const rectX = 300 - rectWidth / 2;
    const rectY = 300 - rectHeight / 2;
    const rect = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };

    // Clear Canvas with Dark Charcoal Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, logicalSize, logicalSize);

    // Draw grid/background preview elements
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 50; i < logicalSize; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, logicalSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(logicalSize, i);
      ctx.stroke();
    }

    // Helper: Return a Path2D describing the shape in shape-local coordinates (centered at 0,0)
    const defineShapePath = () => {
      if (shape.pathType === 'path2d') return new Path2D(shape.path);
      const p = new Path2D();
      if (shape.pathType === 'circle') {
        p.arc(0, 0, 46, 0, Math.PI * 2);
        return p;
      }
      if (shape.pathType === 'roundRect') {
        // build rounded rect path manually using arcTo
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
      context.translate(300, 300);
      context.scale(shapeScale, shapeScale);
    };

    // Calculate Image Placement
    let imgDraw = null;
    const activeImg = uploadedImage || sampleImage;
    const isSample = !uploadedImage && sampleImage;
    const isSampleLabel = isSample && !shape.clipSampleToShape;
    const isTextOnlyShape = shapeIsTextOnly(shape);
    const usesSampleDieLines = Boolean(uploadedImage && sampleImage);
    const usesBleedDieLines = shapeHasBleedAssets(shape) && Boolean(bleedImage && dieLineImage);
    const hasFoilBorder = shapeHasFoilBorder(shape) && Boolean(foilBorderImage);
    const fullBleed = isFullBleedMaterial(selectedMaterial);
    const showFoilBorder = hasFoilBorder && !fullBleed;
    // Cyan bleed guide when bleed assets exist; photo framing follows resolveUploadedPhotoPlacement.
    const showBleedGuide = usesBleedDieLines && Boolean(uploadedImage);

    let labelLayout = sampleImage ? computeSampleLabelLayout(sampleImage, maxTargetSize) : null;
    let trimLayout = labelLayout;
    let bleedLayoutRef = null;
    let dieData = null;
    let foilClipData = null;

    if (usesBleedDieLines) {
      dieData = getBleedDieLineData(bleedImage, dieLineImage, maxTargetSize);
      bleedLayoutRef = dieData.bleedLayout;
      trimLayout = dieData.trimLayout;
      labelLayout = trimLayout;
      if (hasFoilBorder && !fullBleed) {
        foilClipData = getFoilBorderClipData(foilBorderImage, trimLayout, dieData, {
          foilSrc: shape.foilBorderImage
        });
      }
    } else if (labelLayout) {
      if (usesSampleDieLines) {
        dieData = getDieLineData(sampleImage, labelLayout, {
          drawInnerDieLine: shape.dieLines?.inner !== false,
          innerInsetRatio: shape.dieLines?.innerInsetRatio ?? 0.034,
          sampleSrc: shape.sampleImage
        });
        if (hasFoilBorder && !fullBleed) {
          foilClipData = getFoilBorderClipData(foilBorderImage, labelLayout, dieData, {
            foilSrc: shape.foilBorderImage
          });
        }
      } else if (shape.dieLineImage && dieLineImage) {
        dieData = getDieLineData(dieLineImage, labelLayout, {
          drawInnerDieLine: false,
          sampleSrc: shape.dieLineImage,
          strokeMode: shape.dieLines?.strokeMode || null
        });
      }
    }

    const photoPlacement = uploadedImage
      ? resolveUploadedPhotoPlacement({
        shape,
        dieData,
        bleedLayoutRef,
        labelLayout,
        foilClipData,
        uploadedImage,
        hasFoilBorder,
        fullBleed
      })
      : null;

    if (activeImg) {
      if (uploadedImage && photoPlacement) {
        imgDraw = computeImageDraw(activeImg, {
          bounds: photoPlacement.bounds,
          coverFit: photoPlacement.coverFit,
          imageScale,
          imageOffset,
          scaleFactor: 1,
          uploadedImage: true
        });
      } else {
      const imgW = activeImg.naturalWidth || activeImg.width;
      const imgH = activeImg.naturalHeight || activeImg.height;
      const imgRatio = imgW / imgH;

      let drawW, drawH;

      if (isSampleLabel || usesSampleDieLines || usesBleedDieLines) {
        const bounds = labelLayout;
        const boundsRatio = bounds.w / bounds.h;
        if (imgRatio > boundsRatio) {
          drawH = bounds.h;
          drawW = drawH * imgRatio;
        } else {
          drawW = bounds.w;
          drawH = drawW / imgRatio;
        }
      } else if (isSample && shape.clipSampleToShape) {
        const rectRatio = rect.width / rect.height;
        if (imgRatio > rectRatio) {
          drawH = rect.height;
          drawW = drawH * imgRatio;
        } else {
          drawW = rect.width;
          drawH = drawW / imgRatio;
        }
      } else {
        const rectRatio = rect.width / rect.height;
        if (imgRatio > rectRatio) {
          drawH = rect.height;
          drawW = drawH * imgRatio;
        } else {
          drawW = rect.width;
          drawH = drawW / imgRatio;
        }
      }

      let finalW = drawW;
      let finalH = drawH;
      let finalX;
      let finalY;

      if (uploadedImage) {
        finalW = drawW * imageScale;
        finalH = drawH * imageScale;
      }

      if (isSampleLabel || usesSampleDieLines || usesBleedDieLines) {
        const bounds = labelLayout;
        finalX = bounds.x + (bounds.w - finalW) / 2;
        finalY = bounds.y + (bounds.h - finalH) / 2;
      } else {
        finalX = rect.x + (rect.width - finalW) / 2;
        finalY = rect.y + (rect.height - finalH) / 2;
      }

      if (isSample && shape.clipSampleToShape) {
        const scale = shape.sampleImageScale ?? 1;
        finalW = drawW * scale;
        finalH = drawH * scale;
        finalX = rect.x + (rect.width - finalW) / 2;
        finalY = rect.y + (rect.height - finalH) / 2;
      }

      imgDraw = {
        x: finalX + (uploadedImage ? imageOffset.x : 0),
        y: finalY + (uploadedImage ? imageOffset.y : 0),
        w: finalW,
        h: finalH
      };
      }
    }

    const overlayRect = dieData?.hasBleed && trimLayout
      ? { x: trimLayout.x, y: trimLayout.y, width: trimLayout.w, height: trimLayout.h }
      : ((isSampleLabel || usesSampleDieLines) && labelLayout
        ? { x: labelLayout.x, y: labelLayout.y, width: labelLayout.w, height: labelLayout.h }
        : (isSampleLabel && imgDraw
          ? { x: imgDraw.x, y: imgDraw.y, width: imgDraw.w, height: imgDraw.h }
          : rect));

    // --- RENDER STACK ---

    const useFoilBlackBase = shouldDrawFoilBlackBase({
      dieData,
      bleedLayoutRef,
      hasFoilBorder,
      fullBleed,
      uploadedImage
    });

    if (useFoilBlackBase) {
      drawBleedInteriorBlack(ctx, dieData, bleedLayoutRef);
    }

    // Layer 1: Background Fill (legacy template path only)
    if (!isSampleLabel && !usesSampleDieLines) {
      ctx.save();
      applyShapeTransform(ctx);
      const bgPath = defineShapePath(ctx);
      if (bgPath) ctx.clip(bgPath); else ctx.clip();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);
      ctx.restore();
    }

    // Layer 2: Image
    if (activeImg && imgDraw) {
      if ((usesSampleDieLines || usesBleedDieLines) && dieData && uploadedImage && !(repositionMode === 'image')) {
        ctx.save();
        if (photoPlacement) {
          drawImageWithSampleMask(
            ctx,
            activeImg,
            photoPlacement.clipMask,
            photoPlacement.clipLayout,
            imgDraw
          );
        } else {
          const clipMask = foilClipData?.photoClipMask || dieData.maskCanvas;
          drawImageWithSampleMask(ctx, activeImg, clipMask, labelLayout, imgDraw);
        }
        ctx.restore();
      } else if (isSampleLabel || (repositionMode === 'image' && uploadedImage)) {
        ctx.save();
        if (isTextOnlyShape) {
          const ribbonColor = getRibbonColor(ribbonColorId);
          drawTintedRibbon(ctx, activeImg, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h, ribbonColor.color, ribbonColor.id);
        } else {
          ctx.drawImage(activeImg, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h);
        }
        ctx.restore();
      } else {
        ctx.save();
        applyShapeTransform(ctx);
        const imgPath = defineShapePath(ctx);
        if (imgPath) ctx.clip(imgPath); else ctx.clip();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.drawImage(activeImg, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h);
        ctx.restore();
      }
    } else if (!isSampleLabel && !usesSampleDieLines) {
      // Placeholder Pattern (Always Clipped to Shape)
      ctx.save();
      applyShapeTransform(ctx);
      const plPath = defineShapePath(ctx);
      if (plPath) ctx.clip(plPath); else ctx.clip();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      ctx.fillStyle = '#f5f3f0';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.strokeStyle = '#e2dfda';
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x + 10, rect.y + 10, rect.width - 20, rect.height - 20);
      ctx.fillStyle = '#b3afa8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Upload image to preview', rect.x + rect.width / 2, rect.y + rect.height / 2);
      ctx.restore();
    }

    // Layer 2b: Foil border with selected material finish (border only, not the photo area)
    if (showFoilBorder && labelLayout && !(repositionMode === 'image')) {
      ctx.save();
      drawFoilBorderWithMaterial(ctx, foilBorderImage, labelLayout, selectedMaterial);
      ctx.restore();
    }

  // UV coating overlay (subtle gloss)
  if (uvEnabled) {
    ctx.save();
    if (isSampleLabel || usesSampleDieLines) {
      if (usesSampleDieLines && dieData?.outerPath) ctx.clip(dieData.outerPath);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(overlayRect.x, overlayRect.y, overlayRect.width, overlayRect.height);
    } else {
      applyShapeTransform(ctx);
      const uvPath = defineShapePath(ctx);
      if (uvPath) ctx.clip(uvPath); else ctx.clip();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);
    }
    ctx.restore();
  }

    // Layer 4: Die lines — trim (red) then bleed (cyan), on top of foil
    if (dieData && (usesSampleDieLines || shape.dieLineImage || dieData.hasBleed)) {
      drawDieLines(ctx, dieData, {
        strokeTrim: DIE_LINE_COLORS.trim,
        strokeBleed: DIE_LINE_COLORS.bleed,
        strokeInner: 'rgba(255,255,255,0.65)',
        lineWidth: 1.5,
        showBleedLine: false,
        showTrimLine: Boolean(uploadedImage || shape.dieLineImage)
      });
      if (showBleedGuide) {
        drawBleedGuideLine(ctx, dieData, 2);
      }
    } else if (!isSampleLabel) {
      ctx.save();
      applyShapeTransform(ctx);
      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 1.5 / shapeScale;
      const outlinePath = defineShapePath();
      if (outlinePath) ctx.stroke(outlinePath);
      ctx.restore();
    }

    // Layer 5: Text Layer (Unclipped, Customizable segments with subtle black shadow)
    let overflowDetected = false;
    const activeSegments = textSegments.filter(s => s && s.text && s.text.trim().length > 0);
    
    // Ribbon text is intentionally not drawn in the live preview — designers
    // apply the message on the final product from the order details / PDF.
    if (activeSegments.length > 0 && !isTextOnlyShape) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Centered in lower third by default; move up for narrow crest shapes
      let baseTextCenterY = overlayRect.y + overlayRect.height * 0.75;
      if (shape && shape.id === 'template_page_10_crest_wave') {
        baseTextCenterY = overlayRect.y + overlayRect.height * 0.5;
      }
      // Calculate total height of the text block (ignores per-line vertical offsets)
      const totalTextHeight = activeSegments.reduce((acc, seg) => acc + (seg.fontSize * 1.3), 0);
      let currentY = baseTextCenterY - totalTextHeight / 2;

      // Keep track of the outer boundaries of all text segments for dashed outline and overflow detection
      let minX = Infinity;
      let maxX = -Infinity;
      const minY = currentY;
      const maxY = currentY + totalTextHeight;

      activeSegments.forEach((segment) => {
        const fontName = segment.font || 'Playfair Display';
        // avoid forcing bold here to match prior sizing
        ctx.font = `${segment.fontSize}px "${fontName}", serif`;
        ctx.fillStyle = segment.color || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const segOffset = segment.offset || { x: 0, y: 0 };
        const lineY = currentY + segOffset.y;
        const lineX = 300 + segOffset.x;

        // Ensure text fits inside the label area by reducing font size if necessary
        const padding = 24;
        const availableWidth = overlayRect.width - padding;
        let currentFontSize = segment.fontSize;
        ctx.font = `${currentFontSize}px "${fontName}", serif`;
        let metrics = ctx.measureText(segment.text);
        let segmentWidth = metrics.width;
        if (segmentWidth > availableWidth) {
          const scale = availableWidth / segmentWidth;
          const newSize = Math.max(8, Math.floor(currentFontSize * scale));
          currentFontSize = newSize;
          ctx.font = `${currentFontSize}px "${fontName}", serif`;
          metrics = ctx.measureText(segment.text);
          segmentWidth = metrics.width;
        }

        ctx.fillText(segment.text, lineX, lineY);
        const segmentLeft = lineX - segmentWidth / 2;
        const segmentRight = lineX + segmentWidth / 2;

        if (segmentLeft < minX) minX = segmentLeft;
        if (segmentRight > maxX) maxX = segmentRight;

        // Check if segment is outside shape bounds or canvas bounds
        if (
          segmentLeft < overlayRect.x ||
          segmentRight > overlayRect.x + overlayRect.width ||
          lineY < overlayRect.y ||
          (lineY + segment.fontSize * 1.3) > overlayRect.y + overlayRect.height ||
          segmentLeft < 0 ||
          segmentRight > logicalSize ||
          (lineY) < 0 ||
          (lineY + segment.fontSize * 1.3) > logicalSize
        ) {
          overflowDetected = true;
        }

        currentY += segment.fontSize * 1.3;
      });

      // Draw dashed outline if text is selected for repositioning
      if (repositionMode === 'text') {
        ctx.restore(); // restore shadow settings so box isn't shadowed
        ctx.save();
        ctx.strokeStyle = '#c9a84c'; // Gold cut line / border for active editing
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(minX - 8, minY - 8, (maxX - minX) + 16, (maxY - minY) + 16);
      }

      ctx.restore();
    }
    setHasTextOverflow(overflowDetected);

    // Layer 6: Bounding Box Ghost Outline (Unclipped, low-opacity dashed grey)
    if (uploadedImage && imgDraw) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h);
      ctx.restore();
    }

    // Layer 7: Reposition Mode Shading Overlay (draw overlay and punch a hole for the shape)
    if ((repositionMode === 'image' && uploadedImage && imgDraw) || repositionMode === 'text') {
      ctx.save();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, logicalSize, logicalSize);

      // Punch out the label area so interior remains visible
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      if (dieData?.outerPath) {
        ctx.fill(dieData.outerPath);
      } else if (trimLayout) {
        ctx.fillRect(trimLayout.x, trimLayout.y, trimLayout.w, trimLayout.h);
      } else if (labelLayout) {
        ctx.fillRect(labelLayout.x, labelLayout.y, labelLayout.w, labelLayout.h);
      } else {
        applyShapeTransform(ctx);
        const hole = defineShapePath();
        if (hole) ctx.fill(hole);
      }
      ctx.restore();

      // Stroke die lines to emphasize edit region
      ctx.save();
      if ((usesSampleDieLines || dieData?.hasBleed) && dieData) {
        ctx.setLineDash([4, 4]);
        drawDieLines(ctx, dieData, {
          strokeTrim: DIE_LINE_COLORS.trim,
          strokeBleed: DIE_LINE_COLORS.bleed,
          lineWidth: 2,
          showBleedLine: showBleedGuide
        });
      } else {
        applyShapeTransform(ctx);
        ctx.strokeStyle = '#c9a84c';
        ctx.lineWidth = 2 / shapeScale;
        ctx.setLineDash([4, 4]);
        const strokePath = defineShapePath();
        if (strokePath) ctx.stroke(strokePath);
      }
      ctx.restore();

      // Draw reposition message
      ctx.fillStyle = '#c9a84c';
      ctx.font = '14px "Josefin Sans", sans-serif';
      ctx.textAlign = 'center';
      const textMsg = repositionMode === 'image'
        ? 'DRAG TO PAN · SCROLL OR SLIDER TO RESIZE'
        : 'DRAG ON CANVAS TO PAN TEXT';
      ctx.fillText(textMsg, 300, 40);

      ctx.restore();
    }

  }, [
    canvasRef,
    selectedShape,
    selectedMaterial,
    uploadedImage,
    sampleImage,
    foilBorderImage,
    dieLineImage,
    bleedImage,
    imageOffset,
    imageScale,
    textSegments,
    repositionMode,
    ribbonColorId,
    uvEnabled,
    fontsLoaded,
    setHasTextOverflow
  ]);
};
