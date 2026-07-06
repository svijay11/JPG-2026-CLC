export const STANDARD_4CP_MATERIAL_ID = 'standard-4cp';
export const FULL_BLEED_MATERIAL_ID = 'full-bleed';

export const MATERIALS = [
  {
    id: STANDARD_4CP_MATERIAL_ID,
    name: 'Standard 4CP — Original Border',
    price: 0,
    overlayType: 'none',
    color: '#c9a84c',
    description: 'Full-color print with the template\'s original border artwork — no foil or digital upgrade'
  },
  {
    id: FULL_BLEED_MATERIAL_ID,
    name: 'No Embellishments -- Full Bleed To Die-Line',
    price: 0,
    overlayType: 'full-bleed',
    color: '#ffffff',
    description: 'Remove the decorative border — your photo fills the entire label to the die line'
  },
  {
    id: 'digital-gold',
    name: 'Digital — Gold',
    price: 1.50,
    overlayType: 'gradient',
    color: '#d4af37',
    description: 'Soft digital gold overlay tint'
  },
  {
    id: 'digital-silver',
    name: 'Digital — Silver',
    price: 1.50,
    overlayType: 'gradient',
    color: '#c0c0c0',
    description: 'Soft digital silver overlay tint'
  },
  {
    id: 'foil-gold',
    name: 'Foil — Gold',
    price: 2.00,
    overlayType: 'metallic',
    stops: [
      { offset: 0.0, color: '#c9a84c' },
      { offset: 0.25, color: '#f3e5ab' },
      { offset: 0.5, color: '#ffd700' },
      { offset: 0.75, color: '#fff8dc' },
      { offset: 1.0, color: '#c9a84c' }
    ],
    description: 'High-contrast reflective gold metallic overlay'
  },
  {
    id: 'foil-silver',
    name: 'Foil — Silver',
    price: 2.00,
    overlayType: 'metallic',
    stops: [
      { offset: 0.0, color: '#8a9597' },
      { offset: 0.25, color: '#e3e4e5' },
      { offset: 0.5, color: '#ffffff' },
      { offset: 0.75, color: '#b2beb5' },
      { offset: 1.0, color: '#8a9597' }
    ],
    description: 'High-contrast reflective silver metallic overlay'
  },
  {
    id: 'foil-rose-gold',
    name: 'Foil — Rose Gold',
    price: 2.00,
    overlayType: 'metallic',
    stops: [
      { offset: 0.0, color: '#b76e79' },
      { offset: 0.25, color: '#f3c1c6' },
      { offset: 0.5, color: '#e0a899' },
      { offset: 0.75, color: '#ffd1dc' },
      { offset: 1.0, color: '#b76e79' }
    ],
    description: 'High-contrast reflective rose gold metallic overlay'
  }
];

export function isStandard4cpMaterial(materialId) {
  return !materialId || materialId === STANDARD_4CP_MATERIAL_ID;
}

export function isFullBleedMaterial(materialId) {
  return materialId === FULL_BLEED_MATERIAL_ID;
}

export const STATIC_QUANTITY = 10;

export const calculateTotal = (materialId, quantity = STATIC_QUANTITY, uvEnabled = false) => {
  const material = materialId ? MATERIALS.find((m) => m.id === materialId) : null;
  const basePrice = 1.00;
  const materialAddon = material && material.id !== STANDARD_4CP_MATERIAL_ID ? material.price : 0;
  const uvAddon = uvEnabled ? 1.00 : 0;
  const unitPrice = basePrice + materialAddon + uvAddon;
  return {
    unitPrice,
    quantity,
    total: quantity * unitPrice
  };
};
