/** Client-owned export profile for sidecar GLB preview (P0a). */

export const FLOORPLAN_GLB_EXPORT_PROFILE_VERSION = "1";

/** Fixed key order — query string and fingerprint must match. */
export const FLOORPLAN_GLB_FLAG_KEYS = [
  "strict",
  "props",
  "floors",
  "doors",
  "frames",
  "glass",
  "trim",
  "union",
] as const;

export type FloorplanGlbFlagKey = (typeof FLOORPLAN_GLB_FLAG_KEYS)[number];

export type FloorplanGlbExportFlags = Record<FloorplanGlbFlagKey, 0 | 1>;

/** Canonical "good look" flags (same as prior Desktop curl / Download GLB). */
export const DEFAULT_FLOORPLAN_GLB_FLAGS: FloorplanGlbExportFlags = {
  strict: 0,
  props: 1,
  floors: 1,
  doors: 1,
  frames: 1,
  glass: 1,
  trim: 1,
  union: 1,
};

export function mergeFloorplanGlbFlags(
  overrides?: Partial<FloorplanGlbExportFlags>,
): FloorplanGlbExportFlags {
  return { ...DEFAULT_FLOORPLAN_GLB_FLAGS, ...overrides };
}

/** Ordered query string for POST /export/glb. */
export function floorplanGlbQuery(flags: FloorplanGlbExportFlags): string {
  return FLOORPLAN_GLB_FLAG_KEYS.map((k) => `${k}=${flags[k]}`).join("&");
}

/** Stable flag payload for fingerprinting (ordered keys). */
export function floorplanGlbFlagsFingerprintPart(flags: FloorplanGlbExportFlags): string {
  return FLOORPLAN_GLB_FLAG_KEYS.map((k) => `${k}:${flags[k]}`).join("|");
}
