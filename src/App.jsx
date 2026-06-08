import React, { useState, useRef } from 'react';
import PreviewPanel from './components/PreviewPanel';
import ControlPanel from './components/ControlPanel';
import Toast from './components/Toast';
import { useLabelCanvas } from './hooks/useLabelCanvas';

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

  // UV toggle handler
  const handleUvToggle = () => setUvEnabled((prev) => !prev);

  // Text color change handler
  const handleTextColorChange = (color) => setTextColor(color);
  const [quantity, setQuantity] = useState(10);
  const [toastMessage, setToastMessage] = useState(null);

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
    setToastMessage('Order saved! Our team will contact you to confirm.');
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-screen w-screen overflow-y-auto lg:overflow-hidden bg-luxury-charcoal">
      
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
