/** Pure part list for the showroom run (metres; x along the wall, y up, z out of the wall). */
export type Vec3 = readonly [number, number, number];
export type MaterialKey = 'carcass' | 'front' | 'worktop' | 'backsplash' | 'plinth';
export type PartKind = 'plinth' | 'carcass' | 'front' | 'worktop' | 'backsplash';

export type ShowroomPart = {
  id: string;
  kind: PartKind;
  size: Vec3;
  position: Vec3;
  material: MaterialKey;
  cue: number;
  from: Vec3;
  handle?: { size: Vec3; offset: Vec3 };
  drawer?: boolean;
};

export const RUN_LENGTH = 3.0;
export const RUN_START = -RUN_LENGTH / 2;
export const UNIT_WIDTH = 0.6;
export const BASE_DEPTH = 0.6;
export const WALL_DEPTH = 0.35;
export const PLINTH = 0.1;
export const BASE_TOP = 0.82;
export const WORKTOP = 0.04;
export const WALL_BOTTOM = 1.45;
export const TALL_TOP = 2.17;
const FRONT = 0.018;
const GAP = 0.003;
const HANDLE_BAR = 0.16;

type Unit = { id: string; x: number; bottom: number; top: number; depth: number; cue: number; fronts: 'door' | 'doors' | 'drawers'; rise: number };

function units(): Unit[] {
  const list: Unit[] = [{ id: 'pantry', x: RUN_START + UNIT_WIDTH / 2, bottom: PLINTH, top: TALL_TOP, depth: BASE_DEPTH, cue: 0.9, fronts: 'door', rise: -1 }];
  const baseFronts: Unit['fronts'][] = ['drawers', 'doors', 'doors', 'drawers'];
  baseFronts.forEach((fronts, i) => list.push({
    id: `base-${i}`, x: RUN_START + UNIT_WIDTH * (i + 1.5), bottom: PLINTH, top: BASE_TOP,
    depth: BASE_DEPTH, cue: 1.1 + i * 0.2, fronts, rise: -1,
  }));
  for (let i = 0; i < 4; i++) list.push({
    id: `wall-${i}`, x: RUN_START + UNIT_WIDTH * (i + 1.5), bottom: WALL_BOTTOM, top: TALL_TOP,
    depth: WALL_DEPTH, cue: 2.0 + i * 0.2, fronts: 'door', rise: 1,
  });
  return list;
}

function frontRects(unit: Unit): { x: number; y: number; w: number; h: number; drawer: boolean; horizontal: boolean }[] {
  const w = UNIT_WIDTH - GAP * 2, h = unit.top - unit.bottom - GAP * 2, y0 = unit.bottom + GAP;
  if (unit.fronts === 'door') return [{ x: unit.x, y: y0 + h / 2, w, h, drawer: false, horizontal: false }];
  if (unit.fronts === 'doors') {
    const half = (w - GAP) / 2;
    return [-1, 1].map(side => ({ x: unit.x + side * (half + GAP) / 2, y: y0 + h / 2, w: half, h, drawer: false, horizontal: false }));
  }
  const heights = [0.3, 0.26, 0.15].map(share => share / 0.71 * (h - GAP * 2));
  let y = y0;
  return heights.map((dh, i) => {
    const rect = { x: unit.x, y: y + dh / 2, w, h: dh, drawer: i === 2, horizontal: true };
    y += dh + GAP;
    return rect;
  });
}

export function buildShowroomLayout(): ShowroomPart[] {
  const parts: ShowroomPart[] = [{
    id: 'plinth', kind: 'plinth', material: 'plinth', cue: 0.6,
    size: [RUN_LENGTH, PLINTH, BASE_DEPTH - 0.06], position: [0, PLINTH / 2, (BASE_DEPTH - 0.06) / 2], from: [0, -PLINTH - 0.02, 0],
  }];
  let frontIndex = 0;
  for (const unit of units()) {
    const height = unit.top - unit.bottom;
    parts.push({
      id: `${unit.id}-carcass`, kind: 'carcass', material: 'carcass', cue: unit.cue,
      size: [UNIT_WIDTH - 0.002, height, unit.depth], position: [unit.x, unit.bottom + height / 2, unit.depth / 2],
      from: unit.rise < 0 ? [0, -(height + unit.bottom + 0.02), 0] : [0, 0.5, 0],
    });
    frontRects(unit).forEach((rect, i) => {
      const drawerOpens = unit.id === 'base-0' && rect.drawer;
      const handleX = rect.horizontal ? 0 : (rect.w / 2 - 0.05) * (unit.fronts === 'doors' ? (i === 0 ? 1 : -1) : 1);
      const handleY = rect.horizontal ? rect.h / 2 - 0.05 : unit.rise > 0 ? -rect.h / 2 + 0.1 : unit.id === 'pantry' ? -0.15 : rect.h / 2 - 0.1;
      parts.push({
        id: `${unit.id}-front-${i}`, kind: 'front', material: 'front', cue: 3.4 + frontIndex++ * 0.07,
        size: [rect.w, rect.h, FRONT], position: [rect.x, rect.y, unit.depth + FRONT / 2], from: [0, 0, 0.45],
        handle: { size: rect.horizontal ? [HANDLE_BAR, 0.012, 0.022] : [0.012, HANDLE_BAR, 0.022], offset: [handleX, handleY, FRONT / 2 + 0.011] },
        drawer: drawerOpens || undefined,
      });
    });
  }
  const worktopDepth = BASE_DEPTH + 0.02, runWidth = RUN_LENGTH - UNIT_WIDTH, runX = RUN_START + UNIT_WIDTH + runWidth / 2;
  parts.push({
    id: 'worktop', kind: 'worktop', material: 'worktop', cue: 4.9,
    size: [runWidth, WORKTOP, worktopDepth], position: [runX, BASE_TOP + WORKTOP / 2, worktopDepth / 2], from: [0, 0.7, 0],
  });
  const splash = WALL_BOTTOM - BASE_TOP - WORKTOP;
  parts.push({
    id: 'backsplash', kind: 'backsplash', material: 'backsplash', cue: 5.4,
    size: [runWidth, splash, 0.012], position: [runX, BASE_TOP + WORKTOP + splash / 2, 0.006], from: [0, -splash, 0],
  });
  return parts;
}
