import type { CabinetConfig, CabinetInstance, CabinetPlacement, CabinetType } from "./cabinetDimensions";
import { getFootprintDimensions } from "./cabinetDimensions";

export type ExtendedCabinetType = CabinetType | "drawer" | "sink" | "open-shelf" | "corner";

export const extendedTypeLabels: Record<ExtendedCabinetType, string> = {
  base: "Base Cabinet", wall: "Wall Cabinet", tall: "Tall Cabinet",
  almirah: "Almirah", table: "Table", chair: "Chair", sofa: "Sofa",
  mirror: "Mirror", drawer: "Drawer Cabinet", sink: "Sink Cabinet",
  "open-shelf": "Open Shelf", corner: "Corner Cabinet",
};

export const extendedTypePresets: Record<ExtendedCabinetType, CabinetConfig> = {
  base: { type: "base", dimensions: { width: 600, height: 720, depth: 560, boardThickness: 18, backPanelThickness: 6 }, shelfCount: 1, hasDoors: true, toeKickHeight: 100, toeKickInset: 60 },
  wall: { type: "wall", dimensions: { width: 600, height: 720, depth: 320, boardThickness: 18, backPanelThickness: 6 }, shelfCount: 1, hasDoors: true, toeKickHeight: 0, toeKickInset: 0 },
  tall: { type: "tall", dimensions: { width: 600, height: 2100, depth: 600, boardThickness: 18, backPanelThickness: 6 }, shelfCount: 4, hasDoors: true, toeKickHeight: 100, toeKickInset: 60 },
  almirah: { type: "almirah", dimensions: { width: 1200, height: 2200, depth: 600, boardThickness: 18, backPanelThickness: 6 }, shelfCount: 4, hasDoors: true, toeKickHeight: 80, toeKickInset: 40 },
  table: { type: "table", dimensions: { width: 1400, height: 760, depth: 800, boardThickness: 36, backPanelThickness: 18 }, shelfCount: 0, hasDoors: false, toeKickHeight: 0, toeKickInset: 0 },
  chair: { type: "chair", dimensions: { width: 500, height: 900, depth: 520, boardThickness: 30, backPanelThickness: 18 }, shelfCount: 0, hasDoors: false, toeKickHeight: 0, toeKickInset: 0 },
  sofa: { type: "sofa", dimensions: { width: 1800, height: 820, depth: 900, boardThickness: 40, backPanelThickness: 30 }, shelfCount: 0, hasDoors: false, toeKickHeight: 0, toeKickInset: 0 },
  mirror: { type: "mirror", dimensions: { width: 700, height: 1800, depth: 60, boardThickness: 40, backPanelThickness: 8 }, shelfCount: 0, hasDoors: false, toeKickHeight: 0, toeKickInset: 0 },
  drawer: { type: "base", dimensions: { width: 600, height: 720, depth: 560, boardThickness: 18, backPanelThickness: 6 }, shelfCount: 0, hasDoors: false, toeKickHeight: 100, toeKickInset: 60 },
  sink: { type: "base", dimensions: { width: 800, height: 720, depth: 600, boardThickness: 18, backPanelThickness: 6 }, shelfCount: 0, hasDoors: false, toeKickHeight: 100, toeKickInset: 60 },
  "open-shelf": { type: "base", dimensions: { width: 600, height: 720, depth: 400, boardThickness: 18, backPanelThickness: 0 }, shelfCount: 3, hasDoors: false, toeKickHeight: 100, toeKickInset: 60 },
  corner: { type: "base", dimensions: { width: 900, height: 720, depth: 900, boardThickness: 18, backPanelThickness: 6 }, shelfCount: 1, hasDoors: true, toeKickHeight: 100, toeKickInset: 60 },
};

export type LibraryCategory = {
  id: string; label: string; types: ExtendedCabinetType[];
};
export const cabinetLibrary: LibraryCategory[] = [
  { id: "base-cabs", label: "Base Cabinets", types: ["base", "drawer", "sink", "open-shelf", "corner"] },
  { id: "wall-cabs", label: "Wall Cabinets", types: ["wall"] },
  { id: "tall-cabs", label: "Tall Cabinets", types: ["tall", "almirah"] },
];

export type CabinetRun = { cabinets: CabinetInstance[]; wallSide: "back-wall" | "left-wall" | "right-wall" };

export function createCabinetRun(
  cabinets: CabinetInstance[], wallSide: "back-wall" | "left-wall" | "right-wall",
): CabinetRun {
  const sorted = [...cabinets].sort((a, b) => {
    const isVertical = wallSide === "left-wall" || wallSide === "right-wall";
    return isVertical ? a.placement.z - b.placement.z : a.placement.x - b.placement.x;
  });
  let cursor = 0;
  const placed = sorted.map((cab) => {
    const footprint = getFootprintDimensions(cab.config.dimensions, cab.placement.rotation);
    const isVert = wallSide === "left-wall" || wallSide === "right-wall";
    const newCab = { ...cab, placement: { ...cab.placement } };
    if (isVert) {
      newCab.placement.z = cursor + footprint.width / 2;
      cursor += footprint.width;
    } else {
      newCab.placement.x = cursor + footprint.width / 2;
      cursor += footprint.width;
    }
    return newCab;
  });
  return { cabinets: placed, wallSide };
}

export const FILLER_MIN_MM = 50;
export const FILLER_MAX_MM = 150;

export type CabinetFiller = { widthMm: number; positionX: number; positionZ: number };

export function computeFillers(
  run: CabinetRun, targetWidthMm: number,
): CabinetFiller[] {
  const fillers: CabinetFiller[] = [];
  const isVert = run.wallSide === "left-wall" || run.wallSide === "right-wall";
  const total = isVert
    ? run.cabinets.reduce((sum, c) => sum + c.config.dimensions.width, 0)
    : run.cabinets.reduce((sum, c) => sum + c.config.dimensions.width, 0);
  const gap = targetWidthMm - total;
  if (gap <= FILLER_MIN_MM) return fillers;
  const fillerW = Math.min(Math.max(gap / 2, FILLER_MIN_MM), FILLER_MAX_MM);
  if (fillerW < FILLER_MIN_MM) return fillers;
  if (isVert) {
    const firstZ = run.cabinets[0]?.placement.z ?? 0;
    const cz = firstZ - getFootprintDimensions(run.cabinets[0].config.dimensions, 0).width / 2;
    fillers.push({ widthMm: fillerW, positionX: run.cabinets[0]?.placement.x ?? 0, positionZ: cz - fillerW / 2 });
  } else {
    const firstX = run.cabinets[0]?.placement.x ?? 0;
    const cx = firstX - getFootprintDimensions(run.cabinets[0].config.dimensions, 0).width / 2;
    fillers.push({ widthMm: fillerW, positionX: cx - fillerW / 2, positionZ: run.cabinets[0]?.placement.z ?? 0 });
  }
  if (gap - fillerW >= FILLER_MIN_MM) {
    const f2 = Math.min(gap - fillerW, FILLER_MAX_MM);
    if (isVert) {
      const last = run.cabinets[run.cabinets.length - 1];
      if (last) {
        const lz = last.placement.z + getFootprintDimensions(last.config.dimensions, 0).width / 2;
        fillers.push({ widthMm: f2, positionX: last.placement.x, positionZ: lz + f2 / 2 });
      }
    } else {
      const last = run.cabinets[run.cabinets.length - 1];
      if (last) {
        const lx = last.placement.x + getFootprintDimensions(last.config.dimensions, 0).width / 2;
        fillers.push({ widthMm: f2, positionX: lx + f2 / 2, positionZ: last.placement.z });
      }
    }
  }
  return fillers;
}

export function snapCabinetToWall(
  cabinet: CabinetInstance, roomW: number, roomD: number,
  wallSide: "back-wall" | "left-wall" | "right-wall",
): CabinetInstance {
  const fp = getFootprintDimensions(cabinet.config.dimensions, 0);
  const hw = roomW / 2; const hd = roomD / 2;
  let p: CabinetPlacement;
  switch (wallSide) {
    case "back-wall": p = { ...cabinet.placement, attachment: "floor", rotation: 0, z: Math.round((-hd + fp.depth / 2) / 50) * 50, y: 0 }; break;
    case "left-wall": p = { ...cabinet.placement, attachment: "floor", rotation: 90, x: Math.round((-hw + fp.depth / 2) / 50) * 50, y: 0 }; break;
    case "right-wall": p = { ...cabinet.placement, attachment: "floor", rotation: 270, x: Math.round((hw - fp.depth / 2) / 50) * 50, y: 0 }; break;
  }
  return { ...cabinet, placement: p };
}
