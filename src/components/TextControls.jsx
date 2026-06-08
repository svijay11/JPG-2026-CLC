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
  labelText, 
  onTextChange, 
  selectedFont, 
  onFontChange, 
  hasTextOverflow,
  disabled,
  textColor,
  onTextColorChange
}) {
  const charCount = labelText.length;

  return (
    <div className={`space-y-4 transition-opacity duration-300 ${disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Header and Font Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
          5. Typography & Text
        </h3>

        {/* Font Selector + Text Color */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="font-select" className="text-xs font-semibold text-gray-400">
              Font:
            </label>
            <select
              id="font-select"
              value={selectedFont}
              onChange={(e) => onFontChange(e.target.value)}
              disabled={disabled}
              className="text-xs font-semibold text-luxury-charcoal bg-white border border-gray-200 rounded p-1 px-2 pr-6 hover:border-luxury-gold focus:border-luxury-gold focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0aec0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_8px_center] bg-no-repeat transition-colors"
            >
              {FONTS.map((font) => (
                <option key={font.id} value={font.id} style={{ fontFamily: font.id }}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Text Color Swatch */}
          <div className="flex items-center space-x-1.5 ml-auto">
            <label htmlFor="text-color-picker" className="text-xs font-semibold text-gray-400">Color:</label>
            <input
              id="text-color-picker"
              type="color"
              value={textColor || '#000000'}
              onChange={(e) => onTextColorChange && onTextColorChange(e.target.value)}
              disabled={disabled}
              title="Text color"
              className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Text Area */}
      <div className="space-y-1">
        <textarea
          value={labelText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="e.g. Sarah & James • June 14, 2025"
          rows={3}
          disabled={disabled}
          maxLength={200}
          className="w-full p-3 text-sm text-luxury-charcoal bg-white border border-gray-200 rounded-md focus:border-luxury-gold focus:outline-none transition-colors resize-none placeholder-gray-300"
          aria-label="Custom text on label"
        />

        {/* Live character display count */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-gray-400 font-medium">
            Press Enter for a new line. Centered automatically.
          </div>
          <div className="text-[10px] text-gray-400 font-semibold tracking-wide">
            {charCount} / 200 characters
          </div>
        </div>
      </div>

      {/* Overflow Warning */}
      {hasTextOverflow && (
        <div className="flex items-start space-x-2 bg-amber-50 border-l-2 border-amber-500 p-2.5 rounded-r">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-[11px] font-semibold text-amber-800 leading-tight">
            Some text may extend beyond the label edge — check the preview.
          </span>
        </div>
      )}
    </div>
  );
}
