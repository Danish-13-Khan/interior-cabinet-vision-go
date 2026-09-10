export const SHOWROOM_PALETTE_KEY = 'cabinet-studio-showroom-palette';
export const PALETTES = {
  midnight: { name: 'Midnight & walnut', background: '#101a2d', halo: '#304563', text: '#eff3fb', panel: '#243550', border: '#8195b2', wood: '#674735', stone: '#eee5d3', wall: '#adb8c7', handle: '#c29b5d', light: '#ffd398' },
  gallery: { name: 'Gallery white', background: '#e9edf0', halo: '#ffffff', text: '#25313c', panel: '#ffffff', border: '#687b8b', wood: '#343c43', stone: '#faf9f5', wall: '#d8dfe3', handle: '#b2935d', light: '#fff2d8' },
  forest: { name: 'Forest & oak', background: '#10291f', halo: '#355b43', text: '#f1f4e9', panel: '#274936', border: '#91ad96', wood: '#bc9564', stone: '#eee2c9', wall: '#a8b39c', handle: '#4c5144', light: '#ffce8e' },
} as const;
export type PaletteId = keyof typeof PALETTES;
export type ShowroomPalette = { [K in keyof typeof PALETTES.midnight]: string };
export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PALETTES, value);
}
export function readPalette(storage: Pick<Storage, 'getItem'>): PaletteId {
  try { const saved = storage.getItem(SHOWROOM_PALETTE_KEY); return isPaletteId(saved) ? saved : 'midnight'; }
  catch { return 'midnight'; }
}
