import React from 'react';
import { SHAPES } from '../config/shapes';

export default function ShapeSelector({ selectedShape, onSelectShape, disabled }) {
  const activeShape = SHAPES.find((s) => s.id === selectedShape) || SHAPES[0];
  const Tag = activeShape.svgElement.tag;

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

      <div className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Dynamic Shape Silhouette Preview */}
        <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded p-1.5 border border-gray-100 flex-shrink-0">
          <svg
            viewBox="-50 -50 100 100"
            className="w-full h-full max-h-full max-w-full text-luxury-charcoal"
          >
            <Tag
              {...activeShape.svgElement.props}
              stroke="currentColor"
              fill="white"
              strokeWidth={activeShape.id === 'circle' || activeShape.id === 'tall-label' || activeShape.id === 'squircle' ? 3 : 2}
            />
          </svg>
        </div>

        {/* Dropdown Menu */}
        <div className="flex-1 space-y-1">
          <label htmlFor="shape-dropdown" className="text-xs font-semibold text-gray-400 block">
            Label Template:
          </label>
          <div className="relative">
            <select
              id="shape-dropdown"
              value={selectedShape}
              onChange={(e) => onSelectShape(e.target.value)}
              disabled={disabled}
              className="w-full text-sm font-semibold text-luxury-charcoal bg-white border border-gray-200 rounded-lg p-2.5 pr-10 hover:border-luxury-gold focus:border-luxury-gold focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0aec0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_12px_center] bg-no-repeat transition-colors"
            >
              {SHAPES.map((shape) => (
                <option key={shape.id} value={shape.id}>
                  {shape.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
