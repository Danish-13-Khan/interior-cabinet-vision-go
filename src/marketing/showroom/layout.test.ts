import { describe, expect, it } from 'vitest';
import { buildShowroomLayout, RUN_LENGTH } from './layout';
import { DRAWER_CUE, PART_SECONDS, TIMELINE_SECONDS } from './motion';

const parts = buildShowroomLayout();
const extent = (kind: string) => {
  const list = parts.filter(part => part.kind === kind);
  return {
    min: Math.min(...list.map(p => p.position[0] - p.size[0] / 2)),
    max: Math.max(...list.map(p => p.position[0] + p.size[0] / 2)),
  };
};

describe('showroom layout', () => {
  it('is a straight 3.0m run: tall pantry, four base and four wall units', () => {
    const carcasses = parts.filter(part => part.kind === 'carcass');
    expect(carcasses).toHaveLength(9);
    expect(carcasses.filter(part => part.size[1] > 2)).toHaveLength(1);
    const { min, max } = extent('carcass');
    expect(max - min).toBeCloseTo(RUN_LENGTH, 2);
    expect(parts.some(part => part.kind === 'plinth')).toBe(true);
    expect(parts.some(part => part.kind === 'worktop')).toBe(true);
    expect(parts.some(part => part.kind === 'backsplash')).toBe(true);
  });
  it('gives every front a handle and keeps fronts inside the run', () => {
    const fronts = parts.filter(part => part.kind === 'front');
    expect(fronts.length).toBeGreaterThanOrEqual(12);
    expect(fronts.every(front => front.handle)).toBe(true);
    const { min, max } = extent('front');
    expect(min).toBeGreaterThanOrEqual(-RUN_LENGTH / 2);
    expect(max).toBeLessThanOrEqual(RUN_LENGTH / 2);
  });
  it('opens exactly one drawer', () => {
    expect(parts.filter(part => part.drawer)).toHaveLength(1);
  });
  it('sequences carcasses before fronts before the worktop, all settled before the drawer opens', () => {
    const lastCue = (kind: string) => Math.max(...parts.filter(p => p.kind === kind).map(p => p.cue));
    const firstCue = (kind: string) => Math.min(...parts.filter(p => p.kind === kind).map(p => p.cue));
    expect(lastCue('carcass')).toBeLessThan(firstCue('front'));
    expect(lastCue('front')).toBeLessThan(firstCue('worktop'));
    for (const part of parts) {
      expect(part.cue + PART_SECONDS).toBeLessThanOrEqual(DRAWER_CUE + 0.01);
      expect(part.cue).toBeLessThan(TIMELINE_SECONDS);
    }
  });
});
