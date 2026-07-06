import React from 'react';
import { SHAPES, shapeHasFoilBorder, shapeIsTextOnly, shapeAllowsImageUpload } from '../config/shapes';
import MaterialSelector from './MaterialSelector';
import ImageUploader from './ImageUploader';
import TextControls from './TextControls';
import { calculateTotal, STATIC_QUANTITY, isStandard4cpMaterial, isFullBleedMaterial } from '../config/pricing';
import RibbonColorSelector from './RibbonColorSelector';
import LabelSheetSelector from './LabelSheetSelector';
import { getRibbonColor } from '../config/ribbonColors';
import { getLabelSheet } from '../config/labelSheets';

export default function ControlPanel({
  selectedShape,
  onSelectShape,
  onOpenGallery,
  selectedMaterial,
  onSelectMaterial,
  uploadedImage,
  imageUrl,
  onImageUploaded,
  onImageRemoved,
  textSegments,
  onTextSegmentsChange,
  activeTextId,
  onSetActiveTextId,
  repositionMode,
  onRepositionModeChange,
  imageOffset,
  onImageOffsetChange,
  hasTextOverflow,
  quantity,
  onQuantityChange,
  onAddToCart,
  uvEnabled,
  onUvToggle,
  ribbonColorId,
  onRibbonColorChange,
  selectedLabelSheet,
  onSelectLabelSheet
}) {
  const toggleImageReposition = () => {
    if (repositionMode === 'image') {
      onRepositionModeChange('none');
    } else {
      onRepositionModeChange('image');
    }
  };
  // Calculate total pricing based on selected material and quantity
  const activeShape = SHAPES.find((s) => s.id === selectedShape) || SHAPES[0];
  const hasFoilBorder = shapeHasFoilBorder(activeShape);
  const isTextOnly = shapeIsTextOnly(activeShape);
  const allowsImageUpload = shapeAllowsImageUpload(activeShape);
  const materialForPricing = hasFoilBorder ? selectedMaterial : null;
  const { unitPrice, total } = calculateTotal(materialForPricing, quantity, uvEnabled);

  return (
    <div className="w-full lg:w-[40%] bg-luxury-white flex flex-col h-full border-t lg:border-t-0 lg:border-l border-gray-200 relative">
      
      {/* Scrollable Customizer Form */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-72">
        
        {/* Title Block */}
        <div className="space-y-1">
          <h1 className="text-3xl font-serifHeading font-bold text-luxury-charcoal tracking-wide">
            Idyll Time Wines
          </h1>
          <h2 className="text-xs font-sansUI font-semibold tracking-widest text-luxury-gold uppercase">
            Custom Label Studio
          </h2>
        </div>

        <hr className="border-gray-100" />

        {/* Section 1: Selected Template */}
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
          <div className="flex items-center">
            <div className="w-20 h-14 flex items-center justify-center bg-gray-50 rounded border border-gray-100 overflow-hidden">
              {(() => {
                const s = SHAPES.find((sh) => sh.id === selectedShape) || SHAPES[0];
                if (s.sampleImage) {
                  return (
                    <img
                      src={s.sampleImage}
                      alt={`${s.name} preview`}
                      className="max-w-full max-h-full object-contain"
                    />
                  );
                }
                const Tag = s.svgElement.tag;
                return (
                  <svg viewBox="-50 -50 100 100" className="w-full h-full text-luxury-charcoal">
                    <Tag {...s.svgElement.props} stroke="currentColor" fill="white" strokeWidth={2} />
                  </svg>
                );
              })()}
            </div>
            <div className="ml-4">
              <div className="font-semibold text-base text-luxury-charcoal">{(SHAPES.find(s => s.id === selectedShape) || SHAPES[0]).name}</div>
              <div className="text-xs text-gray-500">{(SHAPES.find(s => s.id === selectedShape) || SHAPES[0]).description}</div>
            </div>
          </div>
          <div>
            <button onClick={onOpenGallery} className="text-sm px-3 py-2 bg-white border rounded hover:bg-neutral-50">Go Back</button>
          </div>
        </div>

        {/* Dropdown-style wrapper for customization options */}
        <details className="bg-white border border-gray-100 rounded-lg">
          <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-pink-600 text-center">Select Options</summary>
          <div className="p-4 space-y-4">
            <LabelSheetSelector
              selectedSheetId={selectedLabelSheet}
              onSelectSheet={onSelectLabelSheet}
              disabled={repositionMode !== 'none'}
            />

            {!isTextOnly && (
              <MaterialSelector
                selectedMaterial={selectedMaterial}
                onSelectMaterial={onSelectMaterial}
                disabled={repositionMode !== 'none'}
                hasFoilBorder={hasFoilBorder}
              />
            )}

            {isTextOnly && (
              <RibbonColorSelector
                selectedColorId={ribbonColorId}
                onSelectColor={onRibbonColorChange}
                disabled={repositionMode !== 'none'}
              />
            )}

            {allowsImageUpload ? (
              <ImageUploader
                uploadedImage={uploadedImage}
                imageUrl={imageUrl}
                onImageUploaded={onImageUploaded}
                onImageRemoved={onImageRemoved}
                isRepositioning={repositionMode === 'image'}
                onToggleReposition={() => onRepositionModeChange(repositionMode === 'image' ? 'none' : 'image')}
                disabled={repositionMode === 'text'}
              />
            ) : (
              <div className="p-4 bg-pink-50 border border-pink-100 rounded-lg space-y-1">
                <p className="text-sm font-semibold text-pink-700">Ribbon artwork</p>
                <p className="text-xs text-pink-600/80 leading-relaxed">
                  Pick a ribbon color above, then add your message below — it prints in one line along the left ribbon strand.
                </p>
              </div>
            )}

            <TextControls
              textSegments={textSegments}
              onTextSegmentsChange={onTextSegmentsChange}
              activeTextId={activeTextId}
              onSetActiveTextId={onSetActiveTextId}
              repositionMode={repositionMode}
              onRepositionModeChange={onRepositionModeChange}
              hasTextOverflow={hasTextOverflow}
              disabled={repositionMode === 'image'}
              textOnly={isTextOnly}
              maxTextLines={activeShape.maxTextLines || 6}
              maxTextLength={activeShape.maxTextLength ?? null}
              defaultPathPosition={activeShape.defaultPathPosition ?? 42}
            />

            {!isTextOnly && (
            <div className={`space-y-3 ${repositionMode !== 'none' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uvEnabled}
                  onChange={onUvToggle}
                  disabled={repositionMode !== 'none'}
                  className="w-4 h-4 accent-luxury-gold"
                />
                <div>
                  <span className="text-sm font-medium text-luxury-charcoal">Add UV Coating</span>
                  <span className="ml-2 text-xs text-gray-400">(+$1.00 / label)</span>
                </div>
              </label>
            </div>
            )}

          </div>
        </details>

        <hr className="border-gray-100" />

        {/* Section 7: Quantity Selector */}
        <div className={`space-y-3 transition-opacity duration-300 ${repositionMode !== 'none' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
            7. Quantity
          </h3>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(STATIC_QUANTITY, quantity - 1))}
              disabled={repositionMode !== 'none'}
              className="w-10 h-10 border border-gray-200 hover:border-luxury-gold hover:text-luxury-gold rounded-lg flex items-center justify-center font-bold text-lg transition-colors bg-white shadow-sm disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              min={STATIC_QUANTITY}
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(STATIC_QUANTITY, parseInt(e.target.value) || STATIC_QUANTITY))}
              disabled={repositionMode !== 'none'}
              className="w-20 h-10 border border-gray-200 rounded-lg text-center font-bold text-luxury-charcoal focus:border-luxury-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner disabled:opacity-50"
              aria-label="Quantity amount"
            />
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              disabled={repositionMode !== 'none'}
              className="w-10 h-10 border border-gray-200 hover:border-luxury-gold hover:text-luxury-gold rounded-lg flex items-center justify-center font-bold text-lg transition-colors bg-white shadow-sm disabled:opacity-50"
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
        
        {/* Pricing note */}
          <div className="text-[10px] text-gray-400 italic border border-gray-100 rounded p-2 bg-gray-50">
            All prices are <span className="font-semibold text-gray-500">per label</span>. Every label includes standard <span className="font-semibold text-gray-500">4CP (4-color process)</span> printing at $1.00 / label.
          </div>

          {/* Pricing breakdown */}
          <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-500 font-medium">
            <span>
              {isTextOnly
                ? `Print: ${getRibbonColor(ribbonColorId).name} Ribbon (4CP)`
                : isFullBleedMaterial(selectedMaterial)
                  ? 'Print: Full Bleed — No Border (4CP)'
                  : hasFoilBorder
                  ? (isStandard4cpMaterial(selectedMaterial)
                    ? 'Border: Standard 4CP (Original)'
                    : `Border: ${selectedMaterial.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`)
                  : 'Print: Standard 4CP'}
            </span>
            <span>${unitPrice.toFixed(2)} / unit</span>
          </div>
          <div className="flex justify-between text-gray-500 font-medium">
            <span>Label sheet:</span>
            <span>{getLabelSheet(selectedLabelSheet).name}</span>
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
