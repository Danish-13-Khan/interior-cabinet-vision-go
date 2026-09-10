import { describe, expect, it } from 'vitest';
import { ASSEMBLY_SECONDS, assemblyProgress, lightProgress } from './motion';
import { isPaletteId, readPalette, SHOWROOM_PALETTE_KEY } from './palettes';

describe('showroom preferences', () => {
  it('restores only supported palette IDs without trusting inherited properties', () => {
    for (const id of ['midnight', 'gallery', 'forest']) {
      expect(readPalette({ getItem: key => key === SHOWROOM_PALETTE_KEY ? id : null })).toBe(id);
    }
    for (const invalid of ['toString', '__proto__', '', 'deleted-palette', null]) {
      expect(isPaletteId(invalid)).toBe(false);
      expect(readPalette({ getItem: () => invalid })).toBe('midnight');
    }
  });
  it('survives unavailable storage', () => {
    expect(readPalette({ getItem() { throw new Error('Storage denied'); } })).toBe('midnight');
  });
});

describe('assembly timing', () => {
  it('keeps parts at their starting positions before their cue and finishes all parts', () => {
    for (const delay of [0, .35, .8, 1, 1.25, 1.5, 1.85, 2.2, 2.6, 2.7, 3.1, 3.5]) {
      expect(assemblyProgress(delay - .1, delay)).toBe(0);
      expect(assemblyProgress(ASSEMBLY_SECONDS, delay)).toBe(1);
      let previous = 0;
      for (let time = 0; time <= ASSEMBLY_SECONDS; time += .05) {
        const progress = assemblyProgress(time, delay);
        expect(progress).toBeGreaterThanOrEqual(previous);
        expect(progress).toBeLessThanOrEqual(1);
        previous = progress;
      }
    }
  });
  it('reveals lighting near the end and supports an immediate reduced-motion final state', () => {
    expect(lightProgress(4.4)).toBe(0);
    expect(lightProgress(5)).toBeGreaterThan(0);
    expect(lightProgress(ASSEMBLY_SECONDS)).toBe(1);
  });
});
