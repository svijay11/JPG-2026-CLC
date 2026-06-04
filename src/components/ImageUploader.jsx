import React, { useRef, useState } from 'react';

export default function ImageUploader({ 
  uploadedImage, 
  imageUrl, 
  onImageUploaded, 
  onImageRemoved, 
  isRepositioning, 
  onToggleReposition,
  disabled 
}) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = (file) => {
    if (!file) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setError('Only JPEG and PNG files are supported.');
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onImageUploaded(img, objectUrl);
    };
    img.onerror = () => {
      setError('Failed to load image. File may be corrupted.');
    };
    img.src = objectUrl;
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleZoneClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setError(null);
    onImageRemoved();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 font-sansUI">
        4. Image Upload
      </h3>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleZoneClick}
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none
          ${isDragActive ? 'border-luxury-gold bg-luxury-gold/5 scale-98' : 'border-gray-200 bg-white hover:border-luxury-gold/50'}
          ${disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {uploadedImage && imageUrl ? (
          <div className="flex flex-col items-center space-y-2">
            {/* Thumbnail Preview */}
            <div className="relative w-24 h-24 rounded border border-gray-200 bg-gray-50 overflow-hidden group shadow-sm">
              <img 
                src={imageUrl} 
                alt="Upload preview" 
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRemove}
                disabled={disabled}
                className="absolute top-1 right-1 bg-luxury-charcoal/80 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow"
                aria-label="Remove image"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <span className="text-[11px] text-gray-400 font-medium truncate max-w-[200px]">
              Ready for placement
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            {/* Upload Icon */}
            <div className="p-3 bg-gray-50 rounded-full border border-gray-100 text-gray-400">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-luxury-charcoal">
                Upload your image
              </p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                JPEG or PNG supported
              </p>
              <p className="text-[10px] text-gray-400 font-medium italic mt-1">
                Click to browse or drag & drop
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs font-medium text-red-500 animate-pulse">
          {error}
        </p>
      )}

      {/* Reposition Mode Button */}
      {uploadedImage && (
        <div className="pt-1">
          <button
            onClick={onToggleReposition}
            className={`w-full py-2 px-4 rounded-md text-xs font-semibold tracking-wide border-2 transition-all flex items-center justify-center space-x-2
              ${isRepositioning 
                ? 'bg-luxury-gold text-white border-luxury-gold shadow-md hover:bg-luxury-gold-dark'
                : 'bg-white text-luxury-charcoal border-luxury-charcoal hover:bg-luxury-charcoal hover:text-white'
              }
            `}
          >
            {isRepositioning ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Done Repositioning</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
                <span>Reposition Image</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
