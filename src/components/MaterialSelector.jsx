import React from 'react';
import { MATERIALS } from '../config/pricing';

export default function MaterialSelector({ selectedMaterial, onSelectMaterial, disabled }) {
  return (
    <div className={`space-y-3 transition-opacity duration-300 ${disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
        2. Material Finish
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MATERIALS.map((material) => {
          const isSelected = selectedMaterial === material.id;
          const isFoil = material.overlayType === 'metallic';

          return (
            <button
              key={material.id}
              onClick={() => !disabled && onSelectMaterial(material.id)}
              disabled={disabled}
              className={`flex items-center justify-between p-3 rounded-lg border-2 bg-white text-left transition-all select-none
                ${isSelected 
                  ? 'border-luxury-gold shadow-md' 
                  : 'border-gray-200 hover:border-luxury-gold/50'
                }
              `}
              aria-label={`Select material ${material.name}`}
            >
              <div className="flex items-center space-x-3">
                {/* Material Color Sample Dot */}
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300 shadow-inner flex-shrink-0"
                  style={{ 
                    background: isFoil 
                      ? `linear-gradient(135deg, ${material.stops[0].color}, ${material.stops[2].color})`
                      : material.color
                  }}
                />
                <div>
                  <div className="text-xs font-semibold tracking-wide text-luxury-charcoal">
                    {material.name}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium leading-tight">
                    {isFoil ? 'Metallic reflection foil' : 'Smooth digital overlay'}
                  </div>
                </div>
              </div>

              {/* Price badge */}
              <span className="text-xs font-bold text-luxury-gold bg-luxury-gold/10 px-2 py-1 rounded">
                ${material.price.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
