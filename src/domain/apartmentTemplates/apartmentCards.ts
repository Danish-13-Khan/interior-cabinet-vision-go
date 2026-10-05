import type { ApartmentTemplateSpec } from "./types";
import { ONE_BHK_SHELL_SPEC } from "./specs/oneBhkShell";
import { STUDIO_SHELL_SPEC } from "./specs/studioShell";
import { THREE_BHK_SHELL_SPEC } from "./specs/threeBhkShell";
import { TWO_BHK_SHELL_SPEC } from "./specs/twoBhkShell";

export type ApartmentTemplateCard = {
  id: ApartmentTemplateSpec["id"];
  name: string;
  description: string;
  /** Built-up footprint: outer shell along wall centrelines. */
  footprintM2: number;
  /** Carpet area (D6): sum of room floors inside the wall faces. */
  carpetM2: number;
  /** @deprecated Kept for callers; equals `carpetM2`. */
  areaM2: number;
  roomCount: number;
};

type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };

/** Room cells from the guillotine splits, centred on the shell origin (same as buildApartmentShell). */
function cellRects(spec: ApartmentTemplateSpec): Map<string, Rect> {
  const { widthMm, depthMm } = spec.shell;
  const cells = new Map<string, Rect>([["root", { minX: -widthMm / 2, maxX: widthMm / 2, minZ: -depthMm / 2, maxZ: depthMm / 2 }]]);
  for (const split of spec.splits) {
    const parent = cells.get(split.inCell);
    if (!parent) continue;
    cells.delete(split.inCell);
    const [low, high] = split.cells;
    if (split.axis === "x") {
      cells.set(low, { ...parent, maxX: split.atMm });
      cells.set(high, { ...parent, minX: split.atMm });
    } else {
      cells.set(low, { ...parent, maxZ: split.atMm });
      cells.set(high, { ...parent, minZ: split.atMm });
    }
  }
  return cells;
}

export function apartmentCarpetAreaM2(spec: ApartmentTemplateSpec): number {
  const { widthMm, depthMm, externalWallMm, internalWallMm } = spec.shell;
  const cells = cellRects(spec);
  const half = (edge: number, outer: number) => (Math.abs(Math.abs(edge) - outer / 2) < 1 ? externalWallMm : internalWallMm) / 2;
  let total = 0;
  for (const room of spec.rooms) {
    const r = cells.get(room.cell);
    if (!r) continue;
    const w = r.maxX - r.minX - half(r.minX, widthMm) - half(r.maxX, widthMm);
    const d = r.maxZ - r.minZ - half(r.minZ, depthMm) - half(r.maxZ, depthMm);
    total += Math.max(0, w) * Math.max(0, d);
  }
  return Math.round(total / 1e6);
}

function card(spec: ApartmentTemplateSpec): ApartmentTemplateCard {
  const carpetM2 = apartmentCarpetAreaM2(spec);
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    footprintM2: Math.round((spec.shell.widthMm * spec.shell.depthMm) / 1e6),
    carpetM2,
    areaM2: carpetM2,
    roomCount: spec.rooms.length,
  };
}

/** Project-home / marketing cards for the four product apartments. */
export const APARTMENT_TEMPLATE_CARDS: readonly ApartmentTemplateCard[] = [
  card(STUDIO_SHELL_SPEC),
  card(ONE_BHK_SHELL_SPEC),
  card(TWO_BHK_SHELL_SPEC),
  card(THREE_BHK_SHELL_SPEC),
];
