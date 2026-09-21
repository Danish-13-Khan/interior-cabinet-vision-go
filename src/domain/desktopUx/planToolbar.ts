/**
 * Compact 2D plan toolbar entry catalog (Light drafting studio).
 * Declares primary + secondary entry points; handlers stay on existing commands.
 */

import type { InteriorsWorkflowArea } from "./interiorsWorkflowArea";

export type PlanToolbarEntryId =
  | "zoom-out"
  | "zoom-in"
  | "fit"
  | "fit-selection"
  | "grid"
  | "snap"
  | "layers"
  | "export-sheet"
  | "measure"
  | "calibrate"
  | "undo"
  | "redo";

export type PlanToolbarEntry = {
  id: PlanToolbarEntryId;
  label: string;
  group: "view" | "draw" | "sheet" | "history";
  /** Compact primary bar vs expandable secondary. */
  placement: "primary" | "secondary";
};

export const PLAN_TOOLBAR_ENTRIES: readonly PlanToolbarEntry[] = [
  { id: "undo", label: "Undo", group: "history", placement: "primary" },
  { id: "redo", label: "Redo", group: "history", placement: "primary" },
  { id: "measure", label: "Measure", group: "draw", placement: "primary" },
  { id: "calibrate", label: "Calibrate", group: "draw", placement: "secondary" },
  { id: "zoom-out", label: "Zoom out", group: "view", placement: "primary" },
  { id: "zoom-in", label: "Zoom in", group: "view", placement: "primary" },
  { id: "fit", label: "Fit", group: "view", placement: "primary" },
  { id: "fit-selection", label: "Fit selection", group: "view", placement: "secondary" },
  { id: "grid", label: "Grid", group: "view", placement: "primary" },
  { id: "snap", label: "Snap", group: "view", placement: "primary" },
  { id: "layers", label: "Layers", group: "sheet", placement: "primary" },
  { id: "export-sheet", label: "Export sheet", group: "sheet", placement: "primary" },
] as const;

export type PlanToolbarSecondaryGroup = {
  id: "room-settings" | "openings" | "underlay" | "runs";
  label: string;
  hint: string;
};

/** Expandable secondary sections (mock § Room / openings / underlay / runs). */
export const PLAN_TOOLBAR_SECONDARY_GROUPS: readonly PlanToolbarSecondaryGroup[] = [
  { id: "room-settings", label: "Room", hint: "Dimensions, walls, manage rooms" },
  { id: "openings", label: "Doors & windows", hint: "Add door/window on the active wall" },
  { id: "underlay", label: "Import plan / PDF / DWG", hint: "Underlay opacity and calibrate scale" },
  { id: "runs", label: "Cabinet runs", hint: "Edit run and fillers" },
] as const;

export function planToolbarPrimaryEntries(): PlanToolbarEntry[] {
  return PLAN_TOOLBAR_ENTRIES.filter((entry) => entry.placement === "primary");
}

export function planToolbarSecondaryEntries(): PlanToolbarEntry[] {
  return PLAN_TOOLBAR_ENTRIES.filter((entry) => entry.placement === "secondary");
}

export function planToolbarEntryIds(): PlanToolbarEntryId[] {
  return PLAN_TOOLBAR_ENTRIES.map((entry) => entry.id);
}

/** Compact plan bar is for Room/Cabinets/Materials authoring — not Present. */
export function planToolbarVisibleForArea(area: InteriorsWorkflowArea): boolean {
  return area === "room" || area === "cabinets" || area === "materials";
}

export function planToolbarEntryById(id: PlanToolbarEntryId): PlanToolbarEntry {
  const row = PLAN_TOOLBAR_ENTRIES.find((entry) => entry.id === id);
  if (!row) throw new Error(`Unknown plan toolbar entry: ${id}`);
  return row;
}
