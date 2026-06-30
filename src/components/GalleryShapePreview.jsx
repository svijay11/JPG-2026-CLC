import React from 'react';

export default function GalleryShapePreview({ shape }) {
  if (!shape.sampleImage) {
    const Tag = shape.svgElement.tag;
    return (
      <svg viewBox="-50 -50 100 100" className="w-3/4 h-3/4 text-luxury-charcoal">
        <Tag {...shape.svgElement.props} stroke="currentColor" fill="white" strokeWidth={2} />
      </svg>
    );
  }

  if (shape.clipSampleToShape) {
    const Tag = shape.svgElement.tag;
    const clipId = `gallery-clip-${shape.id}`;
    const scale = shape.sampleImageScale ?? 1;
    return (
      <svg viewBox="-50 -50 100 100" className="w-full h-full">
        <defs>
          <clipPath id={clipId}>
            <Tag {...shape.svgElement.props} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <Tag {...shape.svgElement.props} fill="white" />
          <g transform={`scale(${scale})`}>
            <image
              href={shape.sampleImage}
              x="-50"
              y="-50"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        </g>
      </svg>
    );
  }

  return (
    <img
      src={shape.sampleImage}
      alt={`${shape.name} sample label`}
      className="max-w-full max-h-full object-contain"
    />
  );
}
