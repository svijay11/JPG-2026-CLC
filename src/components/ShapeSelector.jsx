import React from 'react';
import { SHAPES } from '../config/shapes';

export default function ShapeSelector({ selectedShape, onSelectShape, disabled }) {
  return (
    <div className={`space-y-3 transition-opacity duration-300 ${disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
          1. Select Shape
        </h3>
        {disabled && (
          <span className="text-xs text-luxury-gold font-medium">
            Finish repositioning first
          </span>
        )}
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin snap-x">
        {SHAPES.map((shape) => {
          const isSelected = selectedShape === shape.id;
          const Tag = shape.svgElement.tag;

          return (
            <button
              key={shape.id}
              onClick={() => !disabled && onSelectShape(shape.id)}
              disabled={disabled}
              className={`flex-shrink-0 w-24 flex flex-col items-center p-3 rounded-lg border-2 bg-white transition-all snap-start select-none
                ${isSelected 
                  ? 'border-luxury-gold shadow-md scale-105' 
                  : 'border-gray-200 hover:border-luxury-gold/50'
                }
              `}
              aria-label={`Select shape ${shape.name}`}
            >
              {/* Miniature SVG Preview */}
              <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded p-1 border border-gray-100 mb-2">
                <svg
                  viewBox={`0 0 100 ${shape.viewBoxHeight}`}
                  className="w-full h-full max-h-full max-w-full text-luxury-charcoal"
                >
                  <Tag
                    {...shape.svgElement.props}
                    stroke="currentColor"
                    fill="white"
                    strokeWidth={shape.id === 'circle' || shape.id === 'tall-label' || shape.id === 'squircle' ? 3 : 2}
                  />
                </svg>
              </div>

              {/* Nickname label */}
              <span className="text-[11px] font-medium tracking-wide text-gray-700 text-center truncate w-full">
                {shape.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
