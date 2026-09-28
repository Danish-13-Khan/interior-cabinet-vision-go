import { describe, expect, it } from 'vitest';
import {
  cameraAzimuth, CYCLE_SECONDS, cycleTime, DRAWER_CUE, DRAWER_SECONDS, DRAWER_TRAVEL, drawerOpen,
  HOLD_SECONDS, ORBIT_DEGREES, PART_SECONDS, partProgress, TIMELINE_SECONDS, timelineStage,
} from './motion';
import { DEFAULT_PALETTE, isPaletteId, PALETTE_IDS, readPalette, SHOWROOM_PALETTE_KEY } from './palettes';
import { resolveShowroomStart } from './autoplay';

describe('showroom palettes', () => {
  it('offers Oak, White and Walnut and restores only supported IDs', () => {
    expect(PALETTE_IDS).toEqual(['oak', 'white', 'walnut']);
    for (const id of PALETTE_IDS) {
      expect(readPalette({ getItem: key => key === SHOWROOM_PALETTE_KEY ? id : null })).toBe(id);
    }
    for (const invalid of ['toString', '__proto__', '', 'midnight', null]) {
      expect(isPaletteId(invalid)).toBe(false);
      expect(readPalette({ getItem: () => invalid })).toBe(DEFAULT_PALETTE);
    }
  });
  it('survives unavailable storage', () => {
    expect(readPalette({ getItem() { throw new Error('Storage denied'); } })).toBe('oak');
  });
});

describe('showroom timeline', () => {
  it('runs an 8s build, holds 3s, then loops', () => {
    expect(TIMELINE_SECONDS).toBe(8);
    expect(HOLD_SECONDS).toBe(3);
    expect(cycleTime(CYCLE_SECONDS + 1, true)).toBeCloseTo(1);
    expect(cycleTime(CYCLE_SECONDS + 1, false)).toBe(TIMELINE_SECONDS);
  });
  it('walks the stages in order: empty → carcasses → fronts → countertop → drawer → hold', () => {
    const stages = [0, 1, 3.5, 5, 6.5, 9].map(timelineStage);
    expect(stages).toEqual(['empty', 'carcasses', 'fronts', 'countertop', 'drawer', 'hold']);
  });
  it('keeps parts parked before their cue and settled after it', () => {
    expect(partProgress(1.9, 2)).toBe(0);
    expect(partProgress(2 + PART_SECONDS, 2)).toBe(1);
    let previous = 0;
    for (let t = 2; t <= 3; t += 0.05) {
      const value = partProgress(t, 2);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
  it('opens exactly one drawer late in the build and sweeps the camera 20°', () => {
    expect(drawerOpen(DRAWER_CUE - 0.01)).toBe(0);
    expect(drawerOpen(DRAWER_CUE + DRAWER_SECONDS)).toBeCloseTo(DRAWER_TRAVEL);
    const sweep = cameraAzimuth(TIMELINE_SECONDS) - cameraAzimuth(0);
    expect((sweep * 180) / Math.PI).toBeCloseTo(ORBIT_DEGREES);
    expect(cameraAzimuth(TIMELINE_SECONDS + 2)).toBeCloseTo(cameraAzimuth(TIMELINE_SECONDS));
  });
});

describe('showroom start policy', () => {
  it('autoplays a loop on capable devices', () => {
    expect(resolveShowroomStart({ search: '', reducedMotion: false })).toEqual({ kind: 'auto', mode: 'loop' });
  });
  it('shows the finished still with a Play button for reduced motion', () => {
    expect(resolveShowroomStart({ search: '', reducedMotion: true })).toMatchObject({ kind: 'manual', mode: 'once' });
  });
  it('waits for a tap on save-data or 2g connections', () => {
    expect(resolveShowroomStart({ search: '', reducedMotion: false, saveData: true }).kind).toBe('manual');
    expect(resolveShowroomStart({ search: '', reducedMotion: false, effectiveType: 'slow-2g' }).kind).toBe('manual');
    expect(resolveShowroomStart({ search: '', reducedMotion: false, effectiveType: '4g' }).kind).toBe('auto');
  });
  it('renders a still frame in poster mode', () => {
    expect(resolveShowroomStart({ search: '?showroom=poster', reducedMotion: true })).toEqual({ kind: 'auto', mode: 'still' });
  });
});
