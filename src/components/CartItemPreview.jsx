import React, { useEffect, useMemo, useState } from 'react';
import { renderLabelExportCanvas } from '../utils/renderLabelExport';

function buildItemRenderKey(item) {
  return [
    item.shape,
    item.material,
    item.imageScale ?? 1,
    item.imageOffset?.x ?? 0,
    item.imageOffset?.y ?? 0,
    item.uvEnabled ? '1' : '0',
    item.ribbonColorId || '',
    item.labelSheetId || '',
    item.imageDataUrl || '',
    JSON.stringify(item.textSegments || [])
  ].join('::');
}

export default function CartItemPreview({ item, className = '' }) {
  const renderKey = useMemo(() => buildItemRenderKey(item), [item]);
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setSrc(null);

    (async () => {
      try {
        await document.fonts.ready;
        const canvas = await renderLabelExportCanvas(item, {
          logicalSize: 240,
          scaleFactor: 240 / 600
        });
        if (!cancelled) {
          setSrc(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Preview unavailable');
          if (item.thumbnail) {
            setSrc(item.thumbnail);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [renderKey, item]);

  if (error && !src) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center p-1 ${className}`}>
        <span className="text-[9px] text-gray-500 text-center leading-tight">Preview unavailable</span>
      </div>
    );
  }

  if (!src) {
    return <div className={`bg-gray-900 animate-pulse ${className}`} aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt="Custom label preview"
      className={`object-cover ${className}`}
    />
  );
}
