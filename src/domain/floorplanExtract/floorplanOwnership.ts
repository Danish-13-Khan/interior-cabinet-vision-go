/**
 * Dual-doc ownership (P3).
 * Sidecar GLB = pretty preview mesh. InteriorProject = editable Source of Truth.
 * They are not guaranteed identical.
 */
export const FLOORPLAN_OWNERSHIP = {
  sidecar: [
    "Pretty mesh (GLB export: walls, floors, doors, frames, glass, trim)",
    "Extract JSON draft shape from /extract",
  ],
  mvp: [
    "Wall graph / rooms / openings Apply into InteriorProject",
    "Cabinet placement, materials, Studio topology edits",
    "Undoable patches, gates, stale detection",
  ],
} as const;

/** One-line UI copy for Preview mode. */
export const FLOORPLAN_PREVIEW_OWNERSHIP_NOTE =
  "Sidecar owns this mesh · Studio owns editable walls and cabinets";

/** One-line UI copy when shell and mesh diverge. */
export const FLOORPLAN_STALE_OWNERSHIP_NOTE =
  "Studio edits do not update the sidecar mesh — Refresh reloads the original; Re-apply resets the shell";
