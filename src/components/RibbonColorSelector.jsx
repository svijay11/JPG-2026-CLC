import React from 'react';
import { RIBBON_COLORS } from '../config/ribbonColors';

export default function RibbonColorSelector({ selectedColorId, onSelectColor, disabled }) {
  return (
    <div className={`space-y-3 transition-opacity duration-300 ${disabled ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
        2. Ribbon Color
      </h3>
      <div className="grid grid-cols-6 gap-2">
        {RIBBON_COLORS.map((ribbonColor) => (
          <button
            key={ribbonColor.id}
            type="button"
            onClick={() => onSelectColor(ribbonColor.id)}
            disabled={disabled}
            title={ribbonColor.name}
            className={`aspect-square rounded-lg border-2 transition-all shadow-sm ${
              selectedColorId === ribbonColor.id
                ? 'border-pink-500 ring-2 ring-pink-200 scale-105'
                : 'border-gray-200 hover:border-pink-300'
            }`}
            style={{ backgroundColor: ribbonColor.color }}
            aria-label={`${ribbonColor.name} ribbon`}
          />
        ))}
      </div>
      <p className="text-[10px] text-gray-400 leading-relaxed">
        Choose a ribbon color — your message prints in white on top.
      </p>
    </div>
  );
}
