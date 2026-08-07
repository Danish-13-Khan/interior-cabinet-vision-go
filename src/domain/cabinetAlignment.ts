import {
  getFootprintDimensions,
  type CabinetInstance,
} from "./cabinetDimensions";

export type AlignmentMode =
  | "align-left"
  | "align-center-x"
  | "align-right"
  | "align-top"
  | "align-center-z"
  | "align-bottom"
  | "distribute-x"
  | "distribute-z";

export function getCabinetBounds(cabinet: CabinetInstance) {
  const footprint = getFootprintDimensions(
    cabinet.config.dimensions,
    cabinet.placement.rotation,
  );

  return {
    minX: cabinet.placement.x - footprint.width / 2,
    maxX: cabinet.placement.x + footprint.width / 2,
    minZ: cabinet.placement.z - footprint.depth / 2,
    maxZ: cabinet.placement.z + footprint.depth / 2,
    centerX: cabinet.placement.x,
    centerZ: cabinet.placement.z,
    width: footprint.width,
    depth: footprint.depth,
  };
}

export type AlignmentTarget = {
  id: string;
  x: number;
  z: number;
};

/** Compute target X/Z for each cabinet under an alignment mode (no snap/clamp). */
export function computeAlignmentTargets(
  cabinets: CabinetInstance[],
  mode: AlignmentMode,
): AlignmentTarget[] {
  if (cabinets.length < 2) return [];

  const bounds = cabinets.map((cabinet) => ({
    cabinet,
    bounds: getCabinetBounds(cabinet),
  }));

  const sortedByX = [...bounds].sort(
    (first, second) => first.bounds.centerX - second.bounds.centerX,
  );
  const sortedByZ = [...bounds].sort(
    (first, second) => first.bounds.centerZ - second.bounds.centerZ,
  );
  const left = Math.min(...bounds.map((item) => item.bounds.minX));
  const right = Math.max(...bounds.map((item) => item.bounds.maxX));
  const top = Math.min(...bounds.map((item) => item.bounds.minZ));
  const bottom = Math.max(...bounds.map((item) => item.bounds.maxZ));
  const centerX =
    bounds.reduce((sum, item) => sum + item.bounds.centerX, 0) / bounds.length;
  const centerZ =
    bounds.reduce((sum, item) => sum + item.bounds.centerZ, 0) / bounds.length;

  return bounds.map((item) => {
    let nextX = item.cabinet.placement.x;
    let nextZ = item.cabinet.placement.z;

    switch (mode) {
      case "align-left":
        nextX = left + item.bounds.width / 2;
        break;
      case "align-center-x":
        nextX = centerX;
        break;
      case "align-right":
        nextX = right - item.bounds.width / 2;
        break;
      case "align-top":
        nextZ = top + item.bounds.depth / 2;
        break;
      case "align-center-z":
        nextZ = centerZ;
        break;
      case "align-bottom":
        nextZ = bottom - item.bounds.depth / 2;
        break;
      case "distribute-x": {
        const index = sortedByX.findIndex(
          (entry) => entry.cabinet.id === item.cabinet.id,
        );
        const span = right - left;
        const step = sortedByX.length > 1 ? span / (sortedByX.length - 1) : 0;
        nextX = left + step * index;
        break;
      }
      case "distribute-z": {
        const index = sortedByZ.findIndex(
          (entry) => entry.cabinet.id === item.cabinet.id,
        );
        const span = bottom - top;
        const step = sortedByZ.length > 1 ? span / (sortedByZ.length - 1) : 0;
        nextZ = top + step * index;
        break;
      }
    }

    return { id: item.cabinet.id, x: nextX, z: nextZ };
  });
}
