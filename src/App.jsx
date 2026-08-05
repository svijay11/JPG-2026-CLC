import React, { useState, useRef, useEffect } from 'react';
import PreviewPanel from './components/PreviewPanel';
import ControlPanel from './components/ControlPanel';
import GalleryShapePreview from './components/GalleryShapePreview';
import { SHAPES, shapeHasFoilBorder, shapeIsTextOnly, shapeAllowsImageUpload } from './config/shapes';
import Toast from './components/Toast';
import CartModal from './components/CartModal';
import { useLabelCanvas } from './hooks/useLabelCanvas';
import { DEFAULT_RIBBON_COLOR_ID } from './config/ribbonColors';
import OrderDownloadScreen from './components/OrderDownloadScreen';
import { calculateTotal } from './config/pricing';
import { DEFAULT_LABEL_SHEET_ID, labelSheetAllowsUvCoating } from './config/labelSheets';
import { DEFAULT_IMAGE_SCALE, clampImageScale } from './config/imageTransform';
import { imageElementToDataUrl, readBlobAsDataUrl, capturePrintSnapshots, PREVIEW_LOGICAL_SIZE } from './utils/renderLabelExport';

export default function App() {
  const canvasRef = useRef(null);
  const uploadedFileRef = useRef(null);
  const uploadedImageDataUrlRef = useRef(null);
  const [showGallery, setShowGallery] = useState(true);

  // --- STATE LAYER ---
  const [selectedShape, setSelectedShape] = useState('circle');
  const [selectedMaterial, setSelectedMaterial] = useState('standard-4cp');
  
  // uploadedImage holds the HTMLImageElement for canvas drawing
  const [uploadedImage, setUploadedImage] = useState(null);
  // imageUrl holds the blob/object URL for React thumbnail rendering
  const [imageUrl, setImageUrl] = useState(null);
  
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(DEFAULT_IMAGE_SCALE);
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState(null);
  const [textSegments, setTextSegments] = useState([]);
  const [repositionMode, setRepositionMode] = useState('none'); // 'none', 'image', 'text'
  const [activeTextId, setActiveTextId] = useState(null);
  const [uvEnabled, setUvEnabled] = useState(false);
  const [hasTextOverflow, setHasTextOverflow] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [ribbonColorId, setRibbonColorId] = useState(DEFAULT_RIBBON_COLOR_ID);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedLabelSheet, setSelectedLabelSheet] = useState(DEFAULT_LABEL_SHEET_ID);

  // --- CART STATE ---
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [orderMeta, setOrderMeta] = useState(null);

  const handleUvToggle = () => {
    if (!labelSheetAllowsUvCoating(selectedLabelSheet)) return;
    setUvEnabled((prev) => !prev);
  };

  const handleSelectLabelSheet = (sheetId) => {
    setSelectedLabelSheet(sheetId);
    if (!labelSheetAllowsUvCoating(sheetId)) {
      setUvEnabled(false);
    }
  };

  // --- SAMPLE IMAGE PRELOADING (per shape) ---
  const [sampleImages, setSampleImages] = useState({});
  const [foilBorderImages, setFoilBorderImages] = useState({});
  const [dieLineImages, setDieLineImages] = useState({});
  const [bleedImages, setBleedImages] = useState({});
  useEffect(() => {
    SHAPES.forEach((shape) => {
      if (shape.sampleImage) {
        const img = new Image();
        img.src = shape.sampleImage;
        img.onload = () => {
          setSampleImages((prev) => ({ ...prev, [shape.id]: img }));
        };
      }
      if (shape.foilBorderImage) {
        const foilImg = new Image();
        foilImg.src = shape.foilBorderImage;
        foilImg.onload = () => {
          setFoilBorderImages((prev) => ({ ...prev, [shape.id]: foilImg }));
        };
      }
      if (shape.dieLineImage) {
        const dieImg = new Image();
        dieImg.src = shape.dieLineImage;
        dieImg.onload = () => {
          setDieLineImages((prev) => ({ ...prev, [shape.id]: dieImg }));
        };
      }
      if (shape.bleedImage) {
        const bleedImg = new Image();
        bleedImg.src = shape.bleedImage;
        bleedImg.onload = () => {
          setBleedImages((prev) => ({ ...prev, [shape.id]: bleedImg }));
        };
      }
    });
  }, []);

  const sampleImage = sampleImages[selectedShape] || null;
  const foilBorderImage = foilBorderImages[selectedShape] || null;
  const dieLineImage = dieLineImages[selectedShape] || null;
  const bleedImage = bleedImages[selectedShape] || null;
  const effectiveUvEnabled = uvEnabled && labelSheetAllowsUvCoating(selectedLabelSheet);

  const openEditorForShape = (shapeId) => {
    const shape = SHAPES.find((s) => s.id === shapeId);
    setSelectedShape(shapeId);
    if (shape?.disableImageUpload) {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setUploadedImage(null);
      setImageUrl(null);
      setImageOffset({ x: 0, y: 0 });
      setImageScale(DEFAULT_IMAGE_SCALE);
      setUploadedImageDataUrl(null);
      uploadedFileRef.current = null;
      uploadedImageDataUrlRef.current = null;
    }
    if (shapeIsTextOnly(shape) && textSegments.length === 0) {
      setTextSegments([{
        id: String(Date.now()),
        text: '',
        fontSize: shape.defaultFontSize ?? 17,
        color: '#ffffff',
        font: 'Josefin Sans',
        pathPosition: shape.defaultPathPosition ?? 28
      }]);
    }
    setShowGallery(false);
  };

  // --- CANVAS INTEGRATION ---
  useLabelCanvas(canvasRef, {
    selectedShape,
    selectedMaterial,
    uploadedImage,
    sampleImage,
    foilBorderImage,
    dieLineImage,
    bleedImage,
    imageOffset,
    imageScale,
    textSegments,
    repositionMode,
    ribbonColorId,
    uvEnabled: effectiveUvEnabled,
    setHasTextOverflow
  });

  // Clear activeTextId when reposition mode is turned off or switched away from text
  useEffect(() => {
    if (repositionMode !== 'text' && activeTextId) {
      setActiveTextId(null);
    }
  }, [repositionMode]);

  // --- EVENT HANDLERS ---
  const handleImageUploaded = (imgElement, objectUrl, file) => {
    // Revoke old URL if it exists
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setUploadedImage(imgElement);
    setImageUrl(objectUrl);
    setImageOffset({ x: 0, y: 0 });
    setImageScale(DEFAULT_IMAGE_SCALE);
    uploadedFileRef.current = file || null;

    if (file) {
      try {
        const dataUrl = imageElementToDataUrl(imgElement);
        uploadedImageDataUrlRef.current = dataUrl;
        setUploadedImageDataUrl(dataUrl);
      } catch {
        readBlobAsDataUrl(file).then((dataUrl) => {
          uploadedImageDataUrlRef.current = dataUrl;
          setUploadedImageDataUrl(dataUrl);
        }).catch(() => {
          uploadedImageDataUrlRef.current = null;
          setUploadedImageDataUrl(null);
        });
      }
    } else {
      try {
        const dataUrl = imageElementToDataUrl(imgElement);
        uploadedImageDataUrlRef.current = dataUrl;
        setUploadedImageDataUrl(dataUrl);
      } catch {
        uploadedImageDataUrlRef.current = null;
        setUploadedImageDataUrl(null);
      }
    }
  };

  const handleImageRemoved = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setUploadedImage(null);
    setImageUrl(null);
    setImageOffset({ x: 0, y: 0 });
    setImageScale(DEFAULT_IMAGE_SCALE);
    setUploadedImageDataUrl(null);
    uploadedFileRef.current = null;
    uploadedImageDataUrlRef.current = null;
    if (repositionMode === 'image') {
      setRepositionMode('none'); // Cancel reposition mode if active
    }
  };

  const handleSetTextSegmentOffset = (id, newOffset) => {
    setTextSegments((prev) => prev.map((segment) => {
      if (segment.id !== id) return segment;
      if (typeof newOffset.pathPosition === 'number') {
        return { ...segment, pathPosition: newOffset.pathPosition };
      }
      return { ...segment, offset: { x: newOffset.x, y: newOffset.y } };
    }));
  };

  const handleAddToCart = async () => {
    const activeShape = SHAPES.find((s) => s.id === selectedShape);
    const isTextOnly = shapeIsTextOnly(activeShape);

    if (isTextOnly) {
      const hasText = textSegments.some((segment) => segment.text && segment.text.trim().length > 0);
      if (!hasText) {
        setToastMessage('Please add your message on the ribbon before adding to cart.');
        return;
      }
    } else if (!uploadedImage || !(uploadedImage.complete && uploadedImage.naturalWidth)) {
      setToastMessage('Please upload an image to complete your customized label design.');
      return;
    }

    // Wait for the preview canvas to finish its latest paint.
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    let imageDataUrl = null;
    if (!isTextOnly) {
      try {
        if (uploadedImage) {
          // Match preview canvas pixels (respects browser decode / orientation).
          imageDataUrl = imageElementToDataUrl(uploadedImage);
        } else if (uploadedImageDataUrlRef.current) {
          imageDataUrl = uploadedImageDataUrlRef.current;
        } else if (uploadedFileRef.current) {
          imageDataUrl = await readBlobAsDataUrl(uploadedFileRef.current);
        } else if (imageUrl) {
          const blob = await fetch(imageUrl).then((res) => res.blob());
          imageDataUrl = await readBlobAsDataUrl(blob);
        }
      } catch {
        setToastMessage('Could not save your uploaded image. Please re-upload and try again.');
        return;
      }

      if (!imageDataUrl || imageDataUrl.length < 100) {
        setToastMessage('Could not save your uploaded image. Please re-upload and try again.');
        return;
      }
    }

    const hasFoilBorder = shapeHasFoilBorder(activeShape);
    const materialForPricing = hasFoilBorder ? selectedMaterial : null;
    const { unitPrice, total } = calculateTotal(
      materialForPricing,
      quantity,
      effectiveUvEnabled
    );

    const cartItemDraft = {
      shape: selectedShape,
      material: selectedMaterial,
      textSegments: textSegments.map((segment) => ({
        ...segment,
        offset: segment.offset ? { ...segment.offset } : undefined
      })),
      uvEnabled: effectiveUvEnabled,
      ribbonColorId: shapeIsTextOnly(activeShape) ? ribbonColorId : null,
      imageDataUrl,
      imageOffset: { ...imageOffset },
      imageScale,
      labelSheetId: selectedLabelSheet,
      quantity,
      unitPrice,
      totalPrice: total
    };

    let printSnapshots = {};
    try {
      printSnapshots = await capturePrintSnapshots(cartItemDraft, {
        logicalSize: PREVIEW_LOGICAL_SIZE,
        scaleFactor: 1
      });
    } catch (err) {
      console.error('Print snapshot capture failed:', err);
    }

    // Snapshot the live preview for receipt thumbnail.
    let thumbnail = '';
    if (canvasRef.current) {
      try {
        thumbnail = canvasRef.current.toDataURL('image/png');
      } catch {
        thumbnail = '';
      }
    }

    const newItem = {
      ...cartItemDraft,
      ...printSnapshots,
      thumbnail
    };

    setCart((prev) => [...prev, newItem]);
    setCartOpen(true);
    setRepositionMode('none');
    setActiveTextId(null);

    setToastMessage('Added design to cart successfully!');
  };

  const handleRemoveItem = (indexToRemove) => {
    setCart((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCompleteOrder = (items, meta = {}) => {
    setCompletedOrder(items.map((item) => ({ ...item })));
    setOrderMeta(meta);
    setCart([]);
    setCartOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-screen w-screen overflow-y-auto lg:overflow-hidden bg-luxury-charcoal relative">

      {/* Full-screen Gallery */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto p-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h1 className="text-4xl font-bold">The GoodLabel</h1>
              <p className="text-xs text-gray-400 whitespace-nowrap">Minimum 10 labels</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openEditorForShape(s.id)}
                    className="flex flex-col items-stretch bg-white border rounded-lg p-4 hover:shadow-lg transition text-left"
                  >
                    <div className="w-full h-56 bg-gray-50 rounded flex items-center justify-center mb-3 overflow-hidden p-2">
                      <GalleryShapePreview shape={s} />
                    </div>
                    <div className="text-lg font-semibold text-luxury-charcoal">{s.name}</div>
                    {s.tagline && (
                      <p className="text-sm text-gray-600 mt-1.5 leading-snug">{s.tagline}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-1.5">{s.description}</div>
                  </button>
              ))}
            </div>

            <footer className="mt-16 pt-10 border-t border-gray-100 text-center">
              <p className="text-base font-medium text-luxury-charcoal">Don&apos;t see what you want?</p>
              <p className="text-sm text-gray-500 mt-2">
                Email:{' '}
                <a href="mailto:info@jp-graphics.com" className="text-luxury-gold hover:underline">
                  info@jp-graphics.com
                </a>
                {' '}and{' '}
                <a href="mailto:joan@idylltimewines.com" className="text-luxury-gold hover:underline">
                  joan@idylltimewines.com
                </a>
              </p>
            </footer>
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
        imageScale={imageScale}
        onImageScaleChange={(value) => setImageScale(clampImageScale(value))}
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
        imageScale={imageScale}
        onImageScaleChange={(value) => setImageScale(clampImageScale(value))}
        hasTextOverflow={hasTextOverflow}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        uvEnabled={uvEnabled}
        onUvToggle={handleUvToggle}
        ribbonColorId={ribbonColorId}
        onRibbonColorChange={setRibbonColorId}
        selectedLabelSheet={selectedLabelSheet}
        onSelectLabelSheet={handleSelectLabelSheet}
      />

      {/* Slide-over Cart & Checkout Portal */}
      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onRemoveItem={handleRemoveItem}
        onCompleteOrder={handleCompleteOrder}
      />

      {completedOrder && (
        <OrderDownloadScreen
          orderItems={completedOrder}
          orderMeta={orderMeta}
          onDone={() => {
            setCompletedOrder(null);
            setOrderMeta(null);
          }}
        />
      )}

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
