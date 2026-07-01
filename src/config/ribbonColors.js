export const DEFAULT_RIBBON_COLOR_ID = 'pink';

export const RIBBON_COLORS = [
  { id: 'pink', name: 'Pink', color: '#e879a8' },
  { id: 'hot-pink', name: 'Hot Pink', color: '#db2777' },
  { id: 'red', name: 'Red', color: '#dc2626' },
  { id: 'burgundy', name: 'Burgundy', color: '#881337' },
  { id: 'purple', name: 'Purple', color: '#9333ea' },
  { id: 'lavender', name: 'Lavender', color: '#a855f7' },
  { id: 'blue', name: 'Blue', color: '#2563eb' },
  { id: 'teal', name: 'Teal', color: '#0d9488' },
  { id: 'green', name: 'Green', color: '#16a34a' },
  { id: 'gold', name: 'Gold', color: '#ca8a04' },
  { id: 'black', name: 'Black', color: '#262626' },
  { id: 'white', name: 'White', color: '#f5f5f5' }
];

export function getRibbonColor(id) {
  return RIBBON_COLORS.find((c) => c.id === id) || RIBBON_COLORS[0];
}
