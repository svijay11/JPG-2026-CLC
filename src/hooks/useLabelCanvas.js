import { useEffect, useState } from 'react';
import { SHAPES } from '../config/shapes';
import { MATERIALS } from '../config/pricing';

export const useLabelCanvas = (canvasRef, { uvEnabled, textColor,
  selectedShape,
  selectedMaterial,
  uploadedImage,
  imageOffset,
  labelText,
  selectedFont,
  isRepositioning,
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
    const scaleFactor = Math.min(maxTargetSize / shape.viewBoxWidth, maxTargetSize / shape.viewBoxHeight);
    const rectWidth = shape.viewBoxWidth * scaleFactor;
    const rectHeight = shape.viewBoxHeight * scaleFactor;
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

    // Helper: Define Shape Path on Canvas Context
    const defineShapePath = (context) => {
      context.beginPath();
      if (shape.pathType === 'circle') {
        context.arc(50, 50, 46, 0, Math.PI * 2);
      } else if (shape.pathType === 'roundRect') {
        const [rx, ry, rw, rh, rr] = shape.rectParams;
        context.roundRect(rx, ry, rw, rh, rr);
      } else if (shape.pathType === 'path2d') {
        const p = new Path2D(shape.path);
        // Note: clip with Path2D is handled directly by clip(p)
        return p;
      }
      return null;
    };

    // Calculate Image Placement (cover fit)
    let imgDraw = null;
    if (uploadedImage) {
      const imgW = uploadedImage.width;
      const imgH = uploadedImage.height;
      const imgRatio = imgW / imgH;
      const rectRatio = rect.width / rect.height;

      let drawW, drawH;
      if (imgRatio > rectRatio) {
        // Image is wider, match height
        drawH = rect.height;
        drawW = imgH * imgRatio * (rect.height / imgH);
      } else {
        // Image is taller, match width
        drawW = rect.width;
        drawH = imgW * (1 / imgRatio) * (rect.width / imgW);
      }

      const centerX = rect.x + (rect.width - drawW) / 2;
      const centerY = rect.y + (rect.height - drawH) / 2;

      // Apply drag offset
      imgDraw = {
        x: centerX + imageOffset.x,
        y: centerY + imageOffset.y,
        w: drawW,
        h: drawH
      };
    }

    // --- RENDER STACK ---

    // Layer 1: Background Fill (Always Clipped to Shape)
    ctx.save();
    ctx.translate(rect.x, rect.y);
    ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
    const bgPath = defineShapePath(ctx);
    if (bgPath) ctx.clip(bgPath); else ctx.clip();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);
    ctx.restore();

    // Layer 2: Uploaded Image (Unclipped in reposition mode, clipped in normal mode)
    if (uploadedImage && imgDraw) {
      if (isRepositioning) {
        // Draw unclipped full image so it can be seen completely
        ctx.save();
        ctx.drawImage(uploadedImage, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h);
        ctx.restore();
      } else {
        // Draw clipped image
        ctx.save();
        ctx.translate(rect.x, rect.y);
        ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
        const imgPath = defineShapePath(ctx);
        if (imgPath) ctx.clip(imgPath); else ctx.clip();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.drawImage(uploadedImage, imgDraw.x, imgDraw.y, imgDraw.w, imgDraw.h);
        ctx.restore();
      }
    } else {
      // Placeholder Pattern (Always Clipped to Shape)
      ctx.save();
      ctx.translate(rect.x, rect.y);
      ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
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

    // Layer 3: Material Overlay (Always Clipped to Shape)
    ctx.save();
    ctx.translate(rect.x, rect.y);
    ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
    const matPath = defineShapePath(ctx);
    if (matPath) ctx.clip(matPath); else ctx.clip();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    applyMaterialOverlay(ctx, rect, selectedMaterial);
  // UV coating overlay (subtle gloss)
  if (uvEnabled) {
    ctx.save();
    ctx.translate(rect.x, rect.y);
    ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
    const uvPath = defineShapePath(ctx);
    if (uvPath) ctx.clip(uvPath); else ctx.clip();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; // light UV shine
    ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);
    ctx.restore();
  }
    ctx.restore();

    // Layer 4: Shape Outline (Unclipped, drawn in normal scale)
    ctx.save();
    ctx.translate(rect.x, rect.y);
    ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
    
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 1.5 * (shape.viewBoxWidth / rect.width); // Keep stroke constant at ~1.5px
    
    const outlinePath = defineShapePath(ctx);
    if (outlinePath) {
      ctx.stroke(outlinePath);
    } else {
      ctx.stroke();
    }
    ctx.restore();

    // Layer 5: Text Layer (Unclipped, White text with subtle black shadow)
    let overflowDetected = false;
    if (labelText) {
      ctx.save();
      const textCenterY = rect.y + rect.height * 0.75; // Centered in lower third
      const maxWidth = rect.width * 0.80; // Margin boundary
      
      // Auto-fit loop: start at 28px and reduce to 12px
      let fontSize = 28;
      const lines = labelText.split('\n');
      
      let maxLineWidth = 0;
      do {
        ctx.font = `bold ${fontSize}px "${selectedFont}", serif`;
        maxLineWidth = 0;
        for (const line of lines) {
          const metrics = ctx.measureText(line);
          if (metrics.width > maxLineWidth) {
            maxLineWidth = metrics.width;
          }
        }
        if (maxLineWidth <= maxWidth) {
          break;
        }
        fontSize--;
      } while (fontSize > 12);

      // Text styling
      ctx.fillStyle = textColor || '#ffffff';
      ctx.font = `bold ${fontSize}px "${selectedFont}", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow for legibility over white/images
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Draw lines with 1.3x line height
      const lineHeight = fontSize * 1.3;
      const startY = textCenterY - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, i) => {
        const lineY = startY + i * lineHeight;
        ctx.fillText(line, 300, lineY);
      });

      // Check for overflows (out of shape bounds)
      const totalTextHeight = lines.length * lineHeight;
      const textTop = textCenterY - totalTextHeight / 2;
      const textBottom = textCenterY + totalTextHeight / 2;
      
      if (textTop < rect.y || textBottom > rect.y + rect.height || maxLineWidth > rect.width) {
        overflowDetected = true;
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

    // Layer 7: Reposition Mode Shading Overlay
    if (isRepositioning && uploadedImage && imgDraw) {
      ctx.save();
      // Outer rect (full canvas) + Inner shape (subtracted via evenodd)
      ctx.beginPath();
      ctx.rect(0, 0, logicalSize, logicalSize);
      
      // Nested shape matrix transform
      ctx.save();
      ctx.translate(rect.x, rect.y);
      ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
      
      const repPath = defineShapePath(ctx);
      // Wait, to add it to context path:
      if (repPath) {
        // Path2D lacks automatic addition to current canvas path, but we can stroke/fill it.
        // To clip evenodd with Path2D, we can clip the context.
      }
      ctx.restore();
      
      // For evenodd clip, we need shape path drawn inside this path.
      // So instead of Path2D, we can draw it directly since we translated inside ctx.save()/restore()
      ctx.save();
      ctx.translate(rect.x, rect.y);
      ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
      if (shape.pathType === 'circle') {
        ctx.arc(50, 50, 46, 0, Math.PI * 2);
      } else if (shape.pathType === 'roundRect') {
        const [rx, ry, rw, rh, rr] = shape.rectParams;
        ctx.roundRect(rx, ry, rw, rh, rr);
      } else if (shape.pathType === 'path2d') {
        // Path2D can be added to the path using ctx.fill(p) or similar.
        // Wait, to add Path2D to the active path:
        // Modern canvas has a Path2D constructor but we cannot append it directly to another path easily
        // unless we use evenodd clip on path2d directly.
        // But wait! We can just draw the path manually OR since we are inside translate/scale,
        // we can use the canvas clip. Let's think:
        // If we want to shade the area outside, we can just fill the outer area!
        // An easier way to dim the outside area is:
        // 1. Draw a semi-transparent black screen over the whole canvas.
        // 2. Draw the shape path.
        // 3. Set globalCompositeOperation to 'destination-out' to CLEAR the shape path area!
        // 4. Set globalCompositeOperation back to 'source-over'.
        // This is a 100% robust way that works for ALL shapes and Path2D, without needing evenodd clip on composite paths!
      }
      ctx.restore();

      // Let's implement the destination-out clearance. It is extremely elegant!
      // Draw dark semi-transparent screen
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, logicalSize, logicalSize);

      // Now clear the shape area
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#ffffff'; // Color doesn't matter for destination-out
      ctx.translate(rect.x, rect.y);
      ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
      
      if (shape.pathType === 'circle') {
        ctx.beginPath();
        ctx.arc(50, 50, 46, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape.pathType === 'roundRect') {
        ctx.beginPath();
        const [rx, ry, rw, rh, rr] = shape.rectParams;
        ctx.roundRect(rx, ry, rw, rh, rr);
        ctx.fill();
      } else if (shape.pathType === 'path2d') {
        const p = new Path2D(shape.path);
        ctx.fill(p);
      }
      ctx.restore();

      // Now draw a bright dashed highlight around the cut line to emphasize it
      ctx.save();
      ctx.translate(rect.x, rect.y);
      ctx.scale(rect.width / shape.viewBoxWidth, rect.height / shape.viewBoxHeight);
      ctx.strokeStyle = '#c9a84c'; // Gold cut line in reposition mode
      ctx.lineWidth = 2 * (shape.viewBoxWidth / rect.width);
      ctx.setLineDash([4, 4]);
      if (shape.pathType === 'circle') {
        ctx.beginPath();
        ctx.arc(50, 50, 46, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shape.pathType === 'roundRect') {
        ctx.beginPath();
        const [rx, ry, rw, rh, rr] = shape.rectParams;
        ctx.roundRect(rx, ry, rw, rh, rr);
        ctx.stroke();
      } else if (shape.pathType === 'path2d') {
        const p = new Path2D(shape.path);
        ctx.stroke(p);
      }
      ctx.restore();

      // Draw "Repositioning Mode" text overlay
      ctx.fillStyle = '#c9a84c';
      ctx.font = '14px "Josefin Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DRAG ON CANVAS TO PAN IMAGE', 300, 40);

      ctx.restore();
    }

  }, [
    canvasRef,
    selectedShape,
    selectedMaterial,
    uploadedImage,
    imageOffset,
    labelText,
    selectedFont,
    isRepositioning,
    uvEnabled,
    textColor,
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
      gradient.addColorStop(0, 'rgba(212, 175, 55, 0.22)');
      gradient.addColorStop(0.5, 'rgba(255, 235, 170, 0.12)');
      gradient.addColorStop(1, 'rgba(180, 140, 30, 0.22)');
    } else { // digital-silver
      gradient.addColorStop(0, 'rgba(192, 192, 192, 0.22)');
      gradient.addColorStop(0.5, 'rgba(240, 240, 240, 0.12)');
      gradient.addColorStop(1, 'rgba(140, 140, 140, 0.22)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);
  } else if (material.overlayType === 'metallic') {
    ctx.globalCompositeOperation = 'overlay';
    
    // Base solid overlay for color depth
    if (materialId === 'foil-rose-gold') {
      ctx.fillStyle = 'rgba(183, 110, 121, 0.15)';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    material.stops.forEach((stop) => {
      // Foil stops have slightly higher opacity for that shiny metallic reflection stop
      let color = stop.color;
      if (materialId === 'foil-gold') {
        color = stop.offset === 0.25 || stop.offset === 0.75 ? 'rgba(255, 248, 220, 0.15)' : 'rgba(201, 168, 76, 0.4)';
      } else if (materialId === 'foil-silver') {
        color = stop.offset === 0.25 || stop.offset === 0.75 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(138, 149, 151, 0.4)';
      } else if (materialId === 'foil-rose-gold') {
        color = stop.offset === 0.25 || stop.offset === 0.75 ? 'rgba(255, 209, 220, 0.15)' : 'rgba(183, 110, 121, 0.4)';
      }
      gradient.addColorStop(stop.offset, color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20);
  }

  ctx.restore();
};
