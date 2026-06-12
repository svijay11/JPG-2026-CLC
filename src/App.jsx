import React, { useState, useRef } from 'react';
import PreviewPanel from './components/PreviewPanel';
import ControlPanel from './components/ControlPanel';
import Toast from './components/Toast';
import CartModal from './components/CartModal';
import { useLabelCanvas } from './hooks/useLabelCanvas';
import { calculateTotal } from './config/pricing';

export default function App() {
  const canvasRef = useRef(null);

  // --- STATE LAYER ---
  const [selectedShape, setSelectedShape] = useState('circle');
  const [selectedMaterial, setSelectedMaterial] = useState('digital-gold');
  
  // uploadedImage holds the HTMLImageElement for canvas drawing
  const [uploadedImage, setUploadedImage] = useState(null);
  // imageUrl holds the blob/object URL for React thumbnail rendering
  const [imageUrl, setImageUrl] = useState(null);
  
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [labelText, setLabelText] = useState('');
  const [selectedFont, setSelectedFont] = useState('Playfair Display');
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [uvEnabled, setUvEnabled] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [hasTextOverflow, setHasTextOverflow] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [toastMessage, setToastMessage] = useState(null);

  // --- CART STATE ---
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // UV toggle handler
  const handleUvToggle = () => setUvEnabled((prev) => !prev);

  // Text color change handler
  const handleTextColorChange = (color) => setTextColor(color);

  // --- CANVAS INTEGRATION ---
  useLabelCanvas(canvasRef, {
    selectedShape,
    selectedMaterial,
    uploadedImage,
    imageOffset,
    labelText,
    selectedFont,
    isRepositioning,
    uvEnabled,
    textColor,
    setHasTextOverflow
  });

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
    setIsRepositioning(false); // Cancel reposition mode if active
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
      labelText,
      selectedFont,
      uvEnabled,
      textColor,
      quantity,
      unitPrice,
      totalPrice: total,
      thumbnail
    };

    setCart((prev) => [...prev, newItem]);

    // 5. Reset customizing designer states back to standard defaults for the next order
    setLabelText('');
    setUploadedImage(null);
    setImageUrl(null);
    setImageOffset({ x: 0, y: 0 });
    setUvEnabled(false);
    setTextColor('#000000');
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
        isRepositioning={isRepositioning}
        imageOffset={imageOffset}
        onImageOffsetChange={setImageOffset}
      />

      {/* Customization Control Panel (Right 40% on desktop) */}
      <ControlPanel
        selectedShape={selectedShape}
        onSelectShape={setSelectedShape}
        selectedMaterial={selectedMaterial}
        onSelectMaterial={setSelectedMaterial}
        uploadedImage={uploadedImage}
        imageUrl={imageUrl}
        onImageUploaded={handleImageUploaded}
        onImageRemoved={handleImageRemoved}
        labelText={labelText}
        onTextChange={setLabelText}
        selectedFont={selectedFont}
        onFontChange={setSelectedFont}
        imageOffset={imageOffset}
        onImageOffsetChange={setImageOffset}
        isRepositioning={isRepositioning}
        onToggleReposition={() => setIsRepositioning(!isRepositioning)}
        hasTextOverflow={hasTextOverflow}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        uvEnabled={uvEnabled}
        onUvToggle={handleUvToggle}
        textColor={textColor}
        onTextColorChange={handleTextColorChange}
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
