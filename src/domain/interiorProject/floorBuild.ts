import type { InteriorRoomEntity } from "./types";

export type FloorBuild = {
  structuralThicknessMm: number;
  flooringThicknessMm: number;
};

/** Matches today's 12 mm slab when a room has no floorBuild extension. */
export const DEFAULT_FLOOR_BUILD: FloorBuild = {
  structuralThicknessMm: 12,
  flooringThicknessMm: 0,
};

export const FLOOR_BUILD_LIMITS = {
  structuralThicknessMm: { min: 1, max: 600 },
  flooringThicknessMm: { min: 0, max: 80 },
} as const;

export const CEILING_SLAB_THICKNESS_MM = 24;
export const FLOOR_STRUCTURE_MATERIAL_ID = "compiled:floor-structure";

function clamp(value: unknown, fallback: number, band: { min: number; max: number }) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(band.max, Math.max(band.min, value));
}

export function resolveFloorBuild(room: InteriorRoomEntity): FloorBuild {
  const raw = room.extensions?.floorBuild;
  const saved = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return {
    structuralThicknessMm: clamp(
      saved.structuralThicknessMm,
      DEFAULT_FLOOR_BUILD.structuralThicknessMm,
      FLOOR_BUILD_LIMITS.structuralThicknessMm,
    ),
    flooringThicknessMm: clamp(
      saved.flooringThicknessMm,
      DEFAULT_FLOOR_BUILD.flooringThicknessMm,
      FLOOR_BUILD_LIMITS.flooringThicknessMm,
    ),
  };
}

/** Bottom of the structural slab. Finished floor stays at 0. */
export function floorBottomMm(room: InteriorRoomEntity) {
  const build = resolveFloorBuild(room);
  return -(build.structuralThicknessMm + build.flooringThicknessMm);
}

export function flooringBottomMm(room: InteriorRoomEntity) {
  return -resolveFloorBuild(room).flooringThicknessMm;
}

export function writeFloorBuild(room: InteriorRoomEntity, build: FloorBuild): InteriorRoomEntity {
  const resolved = resolveFloorBuild({ ...room, extensions: { ...room.extensions, floorBuild: build } });
  return { ...room, extensions: { ...room.extensions, floorBuild: resolved } };
}
