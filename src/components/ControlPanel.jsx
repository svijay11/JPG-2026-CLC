import React from 'react';
import ShapeSelector from './ShapeSelector';
import MaterialSelector from './MaterialSelector';
import ImageUploader from './ImageUploader';
import TextControls from './TextControls';
import { calculateTotal, STATIC_QUANTITY } from '../config/pricing';

export default function ControlPanel({
  selectedShape,
  onSelectShape,
  selectedMaterial,
  onSelectMaterial,
  uploadedImage,
  imageUrl,
  onImageUploaded,
  onImageRemoved,
  labelText,
  onTextChange,
  selectedFont,
  onFontChange,
  imageOffset,
  onImageOffsetChange,
  isRepositioning,
  onToggleReposition,
  hasTextOverflow,
  quantity,
  onQuantityChange,
  onAddToCart,
  uvEnabled,
  onUvToggle,
  textColor,
  onTextColorChange
}) {
  // Calculate total pricing based on selected material and quantity
  const { unitPrice, total } = calculateTotal(selectedMaterial, quantity, uvEnabled);

  return (
    <div className="w-full lg:w-[40%] bg-luxury-white flex flex-col h-full border-t lg:border-t-0 lg:border-l border-gray-200 relative">
      
      {/* Scrollable Customizer Form */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-72">
        
        {/* Title Block */}
        <div className="space-y-1">
          <h1 className="text-3xl font-serifHeading font-bold text-luxury-charcoal tracking-wide">
            AuraPrint
          </h1>
          <h2 className="text-xs font-sansUI font-semibold tracking-widest text-luxury-gold uppercase">
            Custom Label Studio
          </h2>
        </div>

        <hr className="border-gray-100" />

        {/* Section 1: Template/Shape Selector */}
        <ShapeSelector
          selectedShape={selectedShape}
          onSelectShape={onSelectShape}
          disabled={isRepositioning}
        />

        <hr className="border-gray-100" />

        {/* Section 2: Material Selector */}
        <MaterialSelector
          selectedMaterial={selectedMaterial}
          onSelectMaterial={onSelectMaterial}
          disabled={isRepositioning}
        />

        {/* UV Coating Toggle */}
        <div className={`space-y-3 transition-opacity duration-300 ${isRepositioning ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">7. UV Coating</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={uvEnabled}
              onChange={onUvToggle}
              disabled={isRepositioning}
              className="w-4 h-4 text-luxury-gold bg-white border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">Add UV coating (+$1.00)</span>
          </label>
        </div>

        {/* Text Color Picker */}
        <div className={`space-y-3 transition-opacity duration-300 ${isRepositioning ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">8. Text Color</h3>
          <input
            type="color"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            disabled={isRepositioning}
            className="w-10 h-10 border border-gray-200 rounded"
          />
        </div>

        <hr className="border-gray-100" />

        {/* Section 3: Size Display */}
        <div className={`space-y-3 transition-opacity duration-300 ${isRepositioning ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
            3. Label Size
          </h3>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            <div>
              <div className="text-xs font-bold text-luxury-charcoal">
                4&quot; × 3&quot; <span className="text-gray-400 font-normal ml-1">(Standard size)</span>
              </div>
              <div className="text-[10px] text-gray-400 font-medium leading-tight">
                Optimized layout ratio fit for standard wine bottles.
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Section 4: Image Upload */}
        <ImageUploader
          uploadedImage={uploadedImage}
          imageUrl={imageUrl}
          onImageUploaded={onImageUploaded}
          onImageRemoved={onImageRemoved}
          isRepositioning={isRepositioning}
          onToggleReposition={onToggleReposition}
          disabled={isRepositioning} // zone click is disabled, only done button is clickable
        />

        <hr className="border-gray-100" />

          {/* Section 5: Text Input, Font Selector & Text Color */}
        <TextControls
          labelText={labelText}
          onTextChange={onTextChange}
          selectedFont={selectedFont}
          onFontChange={onFontChange}
          hasTextOverflow={hasTextOverflow}
          disabled={isRepositioning}
        />

        <hr className="border-gray-100" />

        {/* Section 6: Quantity Selector */}
        <div className={`space-y-3 transition-opacity duration-300 ${isRepositioning ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
            6. Quantity
          </h3>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(STATIC_QUANTITY, quantity - 1))}
              className="w-10 h-10 border border-gray-200 hover:border-luxury-gold hover:text-luxury-gold rounded-lg flex items-center justify-center font-bold text-lg transition-colors bg-white shadow-sm"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              min={STATIC_QUANTITY}
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(STATIC_QUANTITY, parseInt(e.target.value) || STATIC_QUANTITY))}
              className="w-20 h-10 border border-gray-200 rounded-lg text-center font-bold text-luxury-charcoal focus:border-luxury-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
              aria-label="Quantity amount"
            />
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-10 h-10 border border-gray-200 hover:border-luxury-gold hover:text-luxury-gold rounded-lg flex items-center justify-center font-bold text-lg transition-colors bg-white shadow-sm"
              aria-label="Increase quantity"
            >
              +
            </button>
            <span className="text-xs text-gray-400 font-medium">labels</span>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Order Footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 md:p-8 shadow-[0_-8px_24px_rgba(0,0,0,0.03)] space-y-4">
        
        {/* Pricing calculations */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-500 font-medium">
            <span>Material: {selectedMaterial.replace('-', ' ').toUpperCase()}</span>
            <span>${unitPrice.toFixed(2)} / unit</span>
          </div>
          <div className="flex justify-between text-gray-500 font-medium">
            <span>Quantity:</span>
            <span>{quantity} labels</span>
          </div>
          {uvEnabled && (
            <div className="flex justify-between text-gray-500 font-medium">
              <span>UV Coating:</span>
              <span>+${1.00.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-dashed border-gray-100 my-2 pt-2 flex justify-between items-baseline">
            <span className="text-sm font-bold text-luxury-charcoal">Total:</span>
            <span className="text-xl font-bold text-luxury-gold">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Add to Cart button */}
        <button
          onClick={onAddToCart}
          className="w-full bg-luxury-charcoal text-luxury-white hover:bg-luxury-gold hover:text-luxury-charcoal font-sansUI font-bold py-3.5 px-6 rounded-md tracking-wider uppercase transition-all shadow-md active:scale-98"
          aria-label="Add custom labels to cart"
        >
          Add to Cart
        </button>
      </div>

    </div>
  );
}
