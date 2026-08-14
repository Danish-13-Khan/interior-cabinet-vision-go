import type {
  OpeningEntity,
  Point3Mm,
  RenderQuality,
  WallEntity,
} from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";
import { wallPoint } from "./sceneCompilerOpenings";

export type WindowOpeningSample = {
  id: string;
  centerMm: Point3Mm;
  widthMm: number;
  heightMm: number;
  /** Unit normal pointing into the room (XZ). */
  inwardNormal: { x: number; z: number };
};

export type WindowKeyLightDescriptor = {
  id: string;
  openingId: string;
  positionMm: Point3Mm;
  targetMm: Point3Mm;
  color: string;
  intensity: number;
  castShadow: boolean;
  shadowPadMeters: number;
};

type RecipeTone = {
  color: string;
  intensityScale: number;
};

const RECIPE_TONE: Record<string, RecipeTone> = {
  daylight: { color: "#e8f2ff", intensityScale: 1 },
  "warm-evening": { color: "#ffd7a8", intensityScale: 0.55 },
  "neutral-studio": { color: "#fff4e8", intensityScale: 0.85 },
};

function qualityIntensity(mode: RenderMode, quality: RenderQuality): number {
  if (mode === "preview") {
    return quality === "draft" ? 0.55 : 0.75;
  }
  if (quality === "draft") return 0.7;
  if (quality === "standard") return 1;
  if (quality === "presentation") return 1.35;
  return 1.25; // client-preview
}

function shouldCastShadow(mode: RenderMode, quality: RenderQuality): boolean {
  if (mode === "preview" && quality === "draft") return false;
  return quality !== "draft";
}

function wallInwardNormal(
  wall: WallEntity,
  openingCenter: { x: number; z: number },
  roomCenter: Point3Mm,
): { x: number; z: number } {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  const tx = dx / length;
  const tz = dz / length;
  const left = { x: -tz, z: tx };
  const right = { x: tz, z: -tx };
  const toCenter = {
    x: roomCenter.x - openingCenter.x,
    z: roomCenter.z - openingCenter.z,
  };
  return left.x * toCenter.x + left.z * toCenter.z >= 0 ? left : right;
}

/** Collect window openings with inward normals — JSON-safe mm data only. */
export function sampleWindowOpenings(args: {
  walls: WallEntity[];
  openings: OpeningEntity[];
  roomCenterMm: Point3Mm;
}): WindowOpeningSample[] {
  const wallsById = new Map(args.walls.map((wall) => [wall.id, wall]));
  return args.openings
    .filter((opening) => opening.kind === "window")
    .map((opening) => {
      const wall = wallsById.get(opening.wallId);
      if (!wall) return null;
      const centerXz = wallPoint(wall, opening.offsetMm + opening.widthMm / 2);
      const inwardNormal = wallInwardNormal(wall, centerXz, args.roomCenterMm);
      const centerY = opening.sillHeightMm + opening.heightMm / 2;
      return {
        id: opening.id,
        centerMm: { x: centerXz.x, y: centerY, z: centerXz.z },
        widthMm: opening.widthMm,
        heightMm: opening.heightMm,
        inwardNormal,
      };
    })
    .filter((sample): sample is WindowOpeningSample => Boolean(sample));
}

/**
 * Resolve directional window key lights for the active recipe/quality.
 * Never writes into InteriorProject JSON.
 */
export function resolveWindowKeyLights(args: {
  openings: readonly WindowOpeningSample[];
  roomCenterMm: Point3Mm;
  recipeId: string;
  mode: RenderMode;
  quality: RenderQuality;
}): WindowKeyLightDescriptor[] {
  if (args.openings.length === 0) return [];
  const tone = RECIPE_TONE[args.recipeId] ?? RECIPE_TONE["neutral-studio"];
  const intensityBase = qualityIntensity(args.mode, args.quality) * tone.intensityScale;
  const castShadow = shouldCastShadow(args.mode, args.quality);

  // Prefer the widest window as the hero key; keep a second if clearly large.
  const ranked = [...args.openings].sort((a, b) => b.widthMm * b.heightMm - a.widthMm * a.heightMm);
  const selected = ranked.slice(0, ranked.length > 1 && ranked[1]!.widthMm >= 1400 ? 2 : 1);

  return selected.map((opening, index) => {
    const outwardPushMm = 900 + opening.widthMm * 0.08;
    const positionMm: Point3Mm = {
      x: opening.centerMm.x - opening.inwardNormal.x * outwardPushMm,
      y: opening.centerMm.y + opening.heightMm * 0.15,
      z: opening.centerMm.z - opening.inwardNormal.z * outwardPushMm,
    };
    const targetMm: Point3Mm = {
      x: args.roomCenterMm.x * 0.35 + opening.centerMm.x * 0.65 + opening.inwardNormal.x * 600,
      y: Math.min(1200, opening.centerMm.y * 0.85),
      z: args.roomCenterMm.z * 0.35 + opening.centerMm.z * 0.65 + opening.inwardNormal.z * 600,
    };
    const sizeFactor = Math.min(1.25, Math.max(0.75, (opening.widthMm * opening.heightMm) / (1800 * 1300)));
    return {
      id: `window-key:${opening.id}`,
      openingId: opening.id,
      positionMm,
      targetMm,
      color: tone.color,
      intensity: intensityBase * (index === 0 ? 1.15 : 0.55) * sizeFactor,
      castShadow: castShadow && index === 0,
      shadowPadMeters: 6.5,
    };
  });
}
