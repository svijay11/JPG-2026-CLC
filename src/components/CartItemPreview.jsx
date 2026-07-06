import React from 'react';

/** Cart preview uses the snapshot captured at add-to-cart time (never re-renders from template assets). */
export default function CartItemPreview({ item, className = '' }) {
  if (!item.thumbnail) {
    return <div className={`bg-gray-900 ${className}`} aria-hidden="true" />;
  }

  return (
    <img
      src={item.thumbnail}
      alt="Custom label preview"
      className={`object-cover ${className}`}
    />
  );
}
