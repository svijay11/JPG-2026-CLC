export const LABEL_SHEETS = [
  { id: 'semi-gloss', name: 'Semi Gloss' },
  { id: 'estate-uncoated', name: 'Estate Label Uncoated' }
];

export const DEFAULT_LABEL_SHEET_ID = 'semi-gloss';

export function getLabelSheet(sheetId) {
  return LABEL_SHEETS.find((s) => s.id === sheetId) || LABEL_SHEETS[0];
}
