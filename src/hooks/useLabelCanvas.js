import { useEffect, useState } from 'react';
import { SHAPES } from '../config/shapes';
import { MATERIALS } from '../config/pricing';

export const useLabelCanvas = (canvasRef, {
  selectedShape,
  selectedMaterial,
  uploadedImage,
  sampleImage,
  imageOffset,
  textSegments,
  repositionMode,
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

    if (activeImg) {
      const imgW = activeImg.width;
      const imgH = activeImg.height;
      const imgRatio = imgW / imgH;
      const rectRatio = rect.width / rect.height;

      let drawW, drawH;

      if (isSampleLabel) {
        // Finished label artwork: size from the image itself, not the template shape
        if (imgRatio >= 1) {
          drawW = maxTargetSize;
          drawH = maxTargetSize / imgRatio;
        } else {
          drawH = maxTargetSize;
          drawW = maxTargetSize * imgRatio;
        }
      } else if (isSample && shape.clipSampleToShape) {
        // Photo cropped to shape (e.g. squircle): cover fit, optionally zoomed out
        if (imgRatio > rectRatio) {
          drawH = rect.height;
          drawW = drawH * imgRatio;
        } else {
          drawW = rect.width;
          drawH = drawW / imgRatio;
        }
      } else {
        // User upload: cover fit inside template shape
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
      let finalX = isSampleLabel
        ? 300 - drawW / 2
        : rect.x + (rect.width - drawW) / 2;
      let finalY = isSampleLabel
        ? 300 - drawH / 2
        : rect.y + (rect.height - drawH) / 2;

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

    const overlayRect = isSampleLabel && imgDraw
      ? { x: imgDraw.x, y: imgDraw.y, width: imgDraw.w, height: imgDraw.h }
      : rect;

    // --- RENDER STACK ---

    // Layer 1: Background Fill (template shape only — not for finished label samples)
    if (!isSampleLabel) {
      ctx.save();
      applyShapeTransform(ctx);
      const bgPath = defineShapePath(ctx);
      if (bgPath) ctx.clip(bgPath); else ctx.clip();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);
      ctx.restore();
    }

    // Layer 2: Image — label samples draw as-is; uploads/photos clip to template
    if (activeImg && imgDraw) {
      if (isSampleLabel || (repositionMode === 'image' && uploadedImage)) {
        ctx.save();
        ctx.drawImage(activeImg, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h);
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
    } else if (!isSampleLabel) {
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

    // Layer 3: Material Overlay
    ctx.save();
    if (isSampleLabel) {
      applyMaterialOverlay(ctx, overlayRect, selectedMaterial);
    } else {
      applyShapeTransform(ctx);
      const matPath = defineShapePath();
      if (matPath) ctx.clip(matPath); else ctx.clip();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyMaterialOverlay(ctx, overlayRect, selectedMaterial);
    }

    if (!isSampleLabel) {
      // Draw a stronger outline after material change so the selected material shape is clearer
      ctx.save();
      applyShapeTransform(ctx);
      ctx.strokeStyle = selectedMaterial.startsWith('foil') ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2 / shapeScale;
      const materialOutline = defineShapePath();
      if (materialOutline) ctx.stroke(materialOutline);
      ctx.restore();
    }

  // UV coating overlay (subtle gloss)
  if (uvEnabled) {
    ctx.save();
    if (isSampleLabel) {
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
    ctx.restore();

    // Layer 4: Shape Outline (template only — label samples already include their shape)
    if (!isSampleLabel) {
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
    
    if (activeSegments.length > 0) {
      ctx.save();
      // Drop shadow for legibility over white/images
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

      // Draw dark overlay across whole canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, logicalSize, logicalSize);

      // Punch out the shape area so interior remains visible using destination-out
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      applyShapeTransform(ctx);
      const hole = defineShapePath();
      if (hole) ctx.fill(hole);
      ctx.restore();

      // Stroke the shape with dashed gold to emphasize
      ctx.save();
      applyShapeTransform(ctx);
      ctx.strokeStyle = '#c9a84c';
      ctx.lineWidth = 2 / shapeScale;
      ctx.setLineDash([4, 4]);
      const strokePath = defineShapePath();
      if (strokePath) ctx.stroke(strokePath);
      ctx.restore();

      // Draw reposition message
      ctx.fillStyle = '#c9a84c';
      ctx.font = '14px "Josefin Sans", sans-serif';
      ctx.textAlign = 'center';
      const textMsg = repositionMode === 'image' ? 'DRAG ON CANVAS TO PAN IMAGE' : 'DRAG ON CANVAS TO PAN TEXT';
      ctx.fillText(textMsg, 300, 40);

      ctx.restore();
    }

  }, [
    canvasRef,
    selectedShape,
    selectedMaterial,
    uploadedImage,
    sampleImage,
    imageOffset,
    textSegments,
    repositionMode,
    uvEnabled,
    fontsLoaded,
    setHasTextOverflow
  ]);
};

// Helper: Material Overlay stop configurations
const applyMaterialOverlay = (ctx, rect, materialId) => {
  ctx.save();
  const material = MATERIALS.find((m) => m.id === materialId) || MATERIALS[0];
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);

  if (material.overlayType === 'gradient') {
    if (materialId === 'digital-gold') {
      gradient.addColorStop(0, 'rgba(212, 175, 55, 0.30)');
      gradient.addColorStop(0.5, 'rgba(255, 235, 170, 0.24)');
      gradient.addColorStop(1, 'rgba(180, 140, 30, 0.30)');
    } else { // digital-silver
      gradient.addColorStop(0, 'rgba(192, 192, 192, 0.30)');
      gradient.addColorStop(0.5, 'rgba(240, 240, 240, 0.22)');
      gradient.addColorStop(1, 'rgba(140, 140, 140, 0.30)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);
  } else if (material.overlayType === 'metallic') {
    ctx.globalCompositeOperation = 'overlay';

    if (materialId === 'foil-gold') {
      ctx.fillStyle = 'rgba(201, 168, 76, 0.18)';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    } else if (materialId === 'foil-silver') {
      ctx.fillStyle = 'rgba(138, 149, 151, 0.18)';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    } else if (materialId === 'foil-rose-gold') {
      ctx.fillStyle = 'rgba(183, 110, 121, 0.18)';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    material.stops.forEach((stop) => {
      let color = stop.color;
      if (materialId === 'foil-gold') {
        color = stop.offset === 0.25 || stop.offset === 0.75 ? 'rgba(255, 248, 220, 0.18)' : 'rgba(201, 168, 76, 0.45)';
      } else if (materialId === 'foil-silver') {
        color = stop.offset === 0.25 || stop.offset === 0.75 ? 'rgba(255, 255, 255, 0.18)' : 'rgba(138, 149, 151, 0.45)';
      } else if (materialId === 'foil-rose-gold') {
        color = stop.offset === 0.25 || stop.offset === 0.75 ? 'rgba(255, 209, 220, 0.18)' : 'rgba(183, 110, 121, 0.45)';
      }
      gradient.addColorStop(stop.offset, color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);
  }

  ctx.restore();
};
