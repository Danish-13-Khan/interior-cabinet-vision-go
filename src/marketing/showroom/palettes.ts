export const SHOWROOM_PALETTE_KEY = 'cabinet-studio-showroom-palette';

export type FrontFinish = 'wood' | 'paint';

export type ShowroomPalette = {
  name: string;
  swatch: string;
  front: string;
  frontFinish: FrontFinish;
  carcass: string;
  worktop: string;
  backsplash: string;
  handle: string;
  handleMetal: number;
};

/** Scene colours are material inputs for WebGL, not UI tokens. */
export const PALETTES = {
  oak: {
    name: 'Oak', swatch: '#c49a6c', front: '#c99d6b', frontFinish: 'wood', carcass: '#efe9df',
    worktop: '#ece9e3', backsplash: '#f3f0ea', handle: '#2e2e2c', handleMetal: 0.4,
  },
  white: {
    name: 'White', swatch: '#f1efea', front: '#f5f3ee', frontFinish: 'paint', carcass: '#f1eee8',
    worktop: '#9a948b', backsplash: '#e9e6df', handle: '#b38e58', handleMetal: 0.85,
  },
  walnut: {
    name: 'Walnut', swatch: '#6b4a34', front: '#80573c', frontFinish: 'wood', carcass: '#ebe4d8',
    worktop: '#f2f0eb', backsplash: '#efebe4', handle: '#cfcac1', handleMetal: 0.9,
  },
} as const satisfies Record<string, ShowroomPalette>;

export type PaletteId = keyof typeof PALETTES;
export const DEFAULT_PALETTE: PaletteId = 'oak';
export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PALETTES, value);
}

export function readPalette(storage: Pick<Storage, 'getItem'>): PaletteId {
  try {
    const saved = storage.getItem(SHOWROOM_PALETTE_KEY);
    return isPaletteId(saved) ? saved : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
}
