import React, { useRef, useState } from 'react';

export default function PreviewPanel({ 
  canvasRef, 
  repositionMode, 
  imageOffset, 
  onImageOffsetChange,
  textSegments = [],
  activeTextId = null,
  onTextSegmentOffsetChange
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const activeReposition = repositionMode !== 'none';

  // Get coords from Mouse or Touch event
  const getCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = (e) => {
    if (!activeReposition) return;
    setIsDragging(true);
    const coords = getCoordinates(e.nativeEvent);
    dragStart.current = coords;
    
    // Prevent scrolling on touch devices during drag
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handleMove = (e) => {
    if (!activeReposition || !isDragging) return;
    const coords = getCoordinates(e.nativeEvent);
    const dx = coords.x - dragStart.current.x;
    const dy = coords.y - dragStart.current.y;

    if (repositionMode === 'image' && onImageOffsetChange) {
      onImageOffsetChange({
        x: imageOffset.x + dx,
        y: imageOffset.y + dy
      });
    } else if (repositionMode === 'text' && onTextSegmentOffsetChange && activeTextId) {
      const seg = textSegments.find(s => s.id === activeTextId);
      const base = seg && seg.offset ? seg.offset : { x: 0, y: 0 };
      onTextSegmentOffsetChange(activeTextId, { x: base.x + dx, y: base.y + dy });
    }

    dragStart.current = coords;
    
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 min-h-[350px] sm:h-full bg-luxury-charcoal flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      
      {/* Canvas Box */}
      <div className="relative shadow-2xl rounded border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className={`max-w-full aspect-square w-[320px] sm:w-[450px] md:w-[500px] lg:w-[550px] xl:w-[600px] block transition-transform duration-300
            ${activeReposition ? 'cursor-move ring-2 ring-luxury-gold/50 shadow-luxury-gold/10' : 'cursor-default'}
          `}
          aria-label="Custom label designer preview mockup"
        />
      </div>

      {/* Muted Legal/Preview Label */}
      <div className="mt-4 text-xs font-semibold tracking-wide text-neutral-500 flex items-center space-x-1.5">
        <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Preview reflects final printed label</span>
      </div>
    </div>
  );
}
