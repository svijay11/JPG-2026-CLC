import React, { useState, useRef, useEffect } from 'react';
import PreviewPanel from './components/PreviewPanel';
import ControlPanel from './components/ControlPanel';
import { SHAPES } from './config/shapes';
import Toast from './components/Toast';
import CartModal from './components/CartModal';
import { useLabelCanvas } from './hooks/useLabelCanvas';
import { calculateTotal } from './config/pricing';

export default function App() {
  const canvasRef = useRef(null);
  const [showGallery, setShowGallery] = useState(true);

  // --- STATE LAYER ---
  const [selectedShape, setSelectedShape] = useState('circle');
  const [selectedMaterial, setSelectedMaterial] = useState('digital-gold');
  
  // uploadedImage holds the HTMLImageElement for canvas drawing
  const [uploadedImage, setUploadedImage] = useState(null);
  // imageUrl holds the blob/object URL for React thumbnail rendering
  const [imageUrl, setImageUrl] = useState(null);
  
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [textSegments, setTextSegments] = useState([
    { id: '1', text: 'John & Jane', fontSize: 26, color: '#000000', font: 'Playfair Display', offset: { x: 0, y: 0 } },
    { id: '2', text: 'June 15, 2026', fontSize: 16, color: '#7a7a7a', font: 'Josefin Sans', offset: { x: 0, y: 0 } },
    { id: '3', text: 'Napa Valley, CA', fontSize: 12, color: '#a3a3a3', font: 'Raleway', offset: { x: 0, y: 0 } }
  ]);
  const [repositionMode, setRepositionMode] = useState('none'); // 'none', 'image', 'text'
  const [activeTextId, setActiveTextId] = useState(null);
  const [uvEnabled, setUvEnabled] = useState(false);
  const [hasTextOverflow, setHasTextOverflow] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [toastMessage, setToastMessage] = useState(null);

  // --- CART STATE ---
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // UV toggle handler
  const handleUvToggle = () => setUvEnabled((prev) => !prev);

  // --- SAMPLE IMAGE PRELOADING ---
  const [sampleImage, setSampleImage] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.src = '/sample_1.jpg';
    img.onload = () => setSampleImage(img);
  }, []);

  const openEditorForShape = (shapeId) => {
    setSelectedShape(shapeId);
    setShowGallery(false);
  };

  // --- CANVAS INTEGRATION ---
  useLabelCanvas(canvasRef, {
    selectedShape,
    selectedMaterial,
    uploadedImage,
    sampleImage,
    imageOffset,
    textSegments,
    repositionMode,
    uvEnabled,
    setHasTextOverflow
  });

  // Clear activeTextId when reposition mode is turned off or switched away from text
  useEffect(() => {
    if (repositionMode !== 'text' && activeTextId) {
      setActiveTextId(null);
    }
  }, [repositionMode]);

  // --- EVENT HANDLERS ---
  const handleImageUploaded = (imgElement, objectUrl) => {
    // Revoke old URL if it exists
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setUploadedImage(imgElement);
    setImageUrl(objectUrl);
    setImageOffset({ x: 0, y: 0 }); // Reset panning offset on new uploads
  };

  const handleImageRemoved = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setUploadedImage(null);
    setImageUrl(null);
    setImageOffset({ x: 0, y: 0 });
    if (repositionMode === 'image') {
      setRepositionMode('none'); // Cancel reposition mode if active
    }
  };

  const handleSetTextSegmentOffset = (id, newOffset) => {
    setTextSegments((prev) => prev.map(s => s.id === id ? { ...s, offset: { x: newOffset.x, y: newOffset.y } } : s));
  };

  const handleAddToCart = () => {
    // 1. Validation: Image is REQUIRED to customize and order labels
    if (!uploadedImage) {
      setToastMessage('Please upload an image to complete your customized label design.');
      return;
    }

    // 2. Capture canvas content as a data URL for thumbnail rendering in cart
    let thumbnail = '';
    if (canvasRef.current) {
      thumbnail = canvasRef.current.toDataURL('image/png');
    }

    // 3. Compute price breakdown
    const { unitPrice, total } = calculateTotal(selectedMaterial, quantity, uvEnabled);

    // 4. Append item to cart array
    const newItem = {
      shape: selectedShape,
      material: selectedMaterial,
      textSegments,
      uvEnabled,
      quantity,
      unitPrice,
      totalPrice: total,
      thumbnail
    };

    setCart((prev) => [...prev, newItem]);

    // 5. Reset customizing designer states back to standard defaults for the next order
    setTextSegments([
      { id: '1', text: 'John & Jane', fontSize: 26, color: '#000000', font: 'Playfair Display', offset: { x: 0, y: 0 } },
      { id: '2', text: 'June 15, 2026', fontSize: 16, color: '#7a7a7a', font: 'Josefin Sans', offset: { x: 0, y: 0 } },
      { id: '3', text: 'Napa Valley, CA', fontSize: 12, color: '#a3a3a3', font: 'Raleway', offset: { x: 0, y: 0 } }
    ]);
    setActiveTextId(null);
    setUploadedImage(null);
    setImageUrl(null);
    setImageOffset({ x: 0, y: 0 });
    setUvEnabled(false);
    setQuantity(10);

    setToastMessage('Added design to cart successfully!');
  };

  const handleRemoveItem = (indexToRemove) => {
    setCart((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-screen w-screen overflow-y-auto lg:overflow-hidden bg-luxury-charcoal relative">

      {/* Full-screen Gallery */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto p-8">
          <div className="max-w-[1400px] mx-auto">
            <h1 className="text-4xl font-bold mb-6">Choose a Label Template</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {SHAPES.map((s) => {
                const Tag = s.svgElement.tag;
                return (
                  <button
                    key={s.id}
                    onClick={() => openEditorForShape(s.id)}
                    className="flex flex-col items-stretch bg-white border rounded-lg p-4 hover:shadow-lg transition"
                  >
                    <div className="w-full h-56 bg-gray-50 rounded flex items-center justify-center mb-3">
                      <svg viewBox="-50 -50 100 100" className="w-3/4 h-3/4 text-luxury-charcoal">
                        {/* render svg tag */}
                        {/**/}
                        {(() => {
                          const T = Tag;
                          return <T {...s.svgElement.props} stroke="currentColor" fill="white" strokeWidth={2} />;
                        })()}
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-luxury-charcoal">{s.name}</div>
                    <div className="text-sm text-gray-500 mt-1">Click to customize</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Cart Icon Top-Right */}
      <button
        onClick={() => setCartOpen(true)}
        className="absolute top-4 right-4 lg:top-6 lg:right-6 z-40 bg-white border border-gray-200 hover:border-luxury-gold text-luxury-charcoal p-3.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
        aria-label="Open Cart"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
            {cart.length}
          </span>
        )}
      </button>

      {/* Live Preview Panel (Left 60% on desktop) */}
      <PreviewPanel
        canvasRef={canvasRef}
        repositionMode={repositionMode}
        imageOffset={imageOffset}
        onImageOffsetChange={setImageOffset}
        textSegments={textSegments}
        activeTextId={activeTextId}
        onTextSegmentOffsetChange={handleSetTextSegmentOffset}
      />

      {/* Customization Control Panel (Right 40% on desktop) */}
      <ControlPanel
        selectedShape={selectedShape}
        onSelectShape={setSelectedShape}
        onOpenGallery={() => setShowGallery(true)}
        selectedMaterial={selectedMaterial}
        onSelectMaterial={setSelectedMaterial}
        uploadedImage={uploadedImage}
        imageUrl={imageUrl}
        onImageUploaded={handleImageUploaded}
        onImageRemoved={handleImageRemoved}
        textSegments={textSegments}
        onTextSegmentsChange={setTextSegments}
        activeTextId={activeTextId}
        onSetActiveTextId={setActiveTextId}
        repositionMode={repositionMode}
        onRepositionModeChange={setRepositionMode}
        imageOffset={imageOffset}
        onImageOffsetChange={setImageOffset}
        hasTextOverflow={hasTextOverflow}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        uvEnabled={uvEnabled}
        onUvToggle={handleUvToggle}
      />

      {/* Slide-over Cart & Checkout Portal */}
      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        setToastMessage={setToastMessage}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
