import React from 'react';
import { MATERIALS } from '../config/pricing';

const digitalMaterials = MATERIALS.filter((m) => m.overlayType === 'gradient');
const foilMaterials = MATERIALS.filter((m) => m.overlayType === 'metallic');

export default function MaterialSelector({
  selectedMaterial,
  onSelectMaterial,
  disabled,
  hasFoilBorder
}) {
  const activeMaterial = MATERIALS.find((m) => m.id === selectedMaterial) || MATERIALS[0];
  const isFoil = activeMaterial.overlayType === 'metallic';
  const isDisabled = disabled || !hasFoilBorder;

  return (
    <div className={`space-y-3 transition-opacity duration-300 ${isDisabled ? 'opacity-60' : 'opacity-100'}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
        2. Border Finish
      </h3>

      {!hasFoilBorder ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            This template has no decorative border, so foil and digital finishes aren&apos;t available here.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Choose a bordered template — Crest Wave, Tapered Shield, Stepped Badge, Tall Label, or Baroque Oval — to customize the border finish.
          </p>
        </div>
      ) : (
        <>
          <div className={`flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <div
              className="w-12 h-12 rounded-full border border-gray-300 shadow-inner flex-shrink-0"
              style={{
                background: isFoil
                  ? `linear-gradient(135deg, ${activeMaterial.stops[0].color}, ${activeMaterial.stops[2].color})`
                  : activeMaterial.color
              }}
              title={activeMaterial.name}
            />

            <div className="flex-1 space-y-1">
              <label htmlFor="material-dropdown" className="text-xs font-semibold text-gray-400 block">
                Border finish:
              </label>
              <div className="relative">
                <select
                  id="material-dropdown"
                  value={selectedMaterial}
                  onChange={(e) => onSelectMaterial(e.target.value)}
                  disabled={disabled}
                  className="w-full text-sm font-semibold text-luxury-charcoal bg-white border border-gray-200 rounded-lg p-2.5 pr-10 hover:border-luxury-gold focus:border-luxury-gold focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0aec0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_12px_center] bg-no-repeat transition-colors"
                >
                  <optgroup label="Digital (Smooth Finish)">
                    {digitalMaterials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} (+${material.price.toFixed(2)})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Foil (Metallic Finish)">
                    {foilMaterials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} (+${material.price.toFixed(2)})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 font-medium leading-relaxed pl-1">
            {isFoil
              ? 'Foil finish applies to the border frame only — your photo stays full color.'
              : 'Digital finish tints the border frame only — your photo stays full color.'}
          </div>
        </>
      )}
    </div>
  );
}
