import React from 'react';

export const FONTS = [
  { id: 'Playfair Display', name: 'Playfair Display (Elegant Serif)' },
  { id: 'Cormorant Garamond', name: 'Cormorant Garamond (Refined Italic Serif)' },
  { id: 'EB Garamond', name: 'EB Garamond (Classic Book Serif)' },
  { id: 'Lora', name: 'Lora (Warm Serif)' },
  { id: 'Libre Baskerville', name: 'Libre Baskerville (Sturdy Serif)' },
  { id: 'Cinzel', name: 'Cinzel (Roman Caps Serif)' },
  { id: 'Great Vibes', name: 'Great Vibes (Formal Script)' },
  { id: 'Dancing Script', name: 'Dancing Script (Casual Script)' },
  { id: 'Josefin Sans', name: 'Josefin Sans (Geometric Sans)' },
  { id: 'Raleway', name: 'Raleway (Elegant Sans)' }
];

export default function TextControls({ 
  textSegments = [],
  onTextSegmentsChange,
  repositionMode,
  onRepositionModeChange,
  activeTextId,
  onSetActiveTextId,
  hasTextOverflow,
  disabled
}) {
  const handleAddSegment = () => {
    if (textSegments.length >= 6) return; // Limit to 6 lines to prevent extreme styling abuse
    const nextId = String(Date.now());
    const newSeg = { id: nextId, text: 'Custom Text', fontSize: 16, color: '#000000', font: 'Playfair Display' };
    onTextSegmentsChange([...textSegments, newSeg]);
  };

  const handleDeleteSegment = (id) => {
    onTextSegmentsChange(textSegments.filter(s => s.id !== id));
  };

  const handleUpdateSegment = (id, field, value) => {
    onTextSegmentsChange(
      textSegments.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  // per-line Position buttons control entering/exiting reposition mode

  const resetTextPositionFor = (id) => {
    onTextSegmentsChange(textSegments.map(s => s.id === id ? { ...s, offset: { x: 0, y: 0 } } : s));
  };

  return (
    <div className={`space-y-5 transition-opacity duration-300 ${disabled && repositionMode !== 'text' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Header and Reposition controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
          5. Typography & Text
        </h3>

        {/* Text Positioning Tools */}
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-400">Use the "Position" button next to each line to move that line.</div>
        </div>
      </div>

      {/* Editor list for each segment */}
      <div className="space-y-4">
        {textSegments.map((segment, index) => (
          <div key={segment.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/60 space-y-3 relative group">
            
            {/* Header row: line description & delete */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Line {index + 1}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (repositionMode === 'text' && activeTextId === segment.id) {
                      onRepositionModeChange('none');
                      onSetActiveTextId(null);
                    } else {
                      onRepositionModeChange('text');
                      onSetActiveTextId(segment.id);
                    }
                  }}
                  className={`text-[10px] font-semibold px-2 py-1 rounded ${activeTextId === segment.id && repositionMode === 'text' ? 'bg-luxury-gold text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                  title={activeTextId === segment.id && repositionMode === 'text' ? 'Finish positioning this line' : 'Position this line'}
                >
                  Position
                </button>
                {textSegments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSegment(segment.id)}
                    className="text-[10px] font-semibold text-red-500 hover:text-red-700 transition-colors p-1"
                    aria-label="Remove line"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Row 1: Text Input */}
            <input
              type="text"
              value={segment.text}
              onChange={(e) => handleUpdateSegment(segment.id, 'text', e.target.value)}
              placeholder={`Line ${index + 1} text`}
              className="w-full p-2 text-sm text-luxury-charcoal bg-white border border-neutral-200 rounded focus:border-luxury-gold focus:outline-none transition-colors"
            />

            {/* Row 2: Styling settings */}
            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Font selector */}
              <div className="col-span-5 flex flex-col space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase">Font</label>
                <select
                  value={segment.font || 'Playfair Display'}
                  onChange={(e) => handleUpdateSegment(segment.id, 'font', e.target.value)}
                  className="text-xs font-semibold text-luxury-charcoal bg-white border border-neutral-200 rounded p-1 hover:border-luxury-gold focus:border-luxury-gold focus:outline-none cursor-pointer"
                >
                  {FONTS.map((font) => (
                    <option key={font.id} value={font.id} style={{ fontFamily: font.id }}>
                      {font.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size slider */}
              <div className="col-span-5 flex flex-col space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase">Size ({segment.fontSize}px)</label>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={segment.fontSize}
                  onChange={(e) => handleUpdateSegment(segment.id, 'fontSize', parseInt(e.target.value) || 12)}
                  className="w-full accent-luxury-gold cursor-pointer"
                />
              </div>

              {/* Color picker */}
              <div className="col-span-2 flex flex-col items-center space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase">Color</label>
                <input
                  type="color"
                  value={segment.color || '#000000'}
                  onChange={(e) => handleUpdateSegment(segment.id, 'color', e.target.value)}
                  className="w-7 h-7 rounded border border-neutral-200 cursor-pointer p-0.5 bg-white"
                  title="Choose line color"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <button
                type="button"
                onClick={() => resetTextPositionFor(segment.id)}
                className="text-xs font-semibold px-2 py-1 rounded bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200"
              >
                Recenter Line
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Line button & limit warnings */}
      {textSegments.length < 6 && (
        <button
          type="button"
          onClick={handleAddSegment}
          className="w-full py-2 border border-dashed border-neutral-300 hover:border-luxury-gold text-neutral-500 hover:text-luxury-gold rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1 bg-white hover:bg-neutral-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Custom Line</span>
        </button>
      )}

      {/* Warning label */}
      {hasTextOverflow && (
        <div className="flex items-start space-x-2 bg-amber-50 border-l-2 border-amber-500 p-2.5 rounded-r">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-[11px] font-semibold text-amber-800 leading-tight">
            some of the text might not be visible in the final product.
          </span>
        </div>
      )}
    </div>
  );
}
