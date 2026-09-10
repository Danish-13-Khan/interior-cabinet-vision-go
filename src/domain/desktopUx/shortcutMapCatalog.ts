import type { ShortcutActionId, ShortcutMap } from "./shortcutMap";

/** Fired only while the 3D model canvas has keyboard focus. */
export const MODEL_VIEW_SHORTCUT_ACTION_IDS = [
  "modelCamTop",
  "modelCamFront",
  "modelCamSide",
  "modelCamIsometric",
  "modelCamPerspective",
  "modelCamOrbit",
  "modelFitRoom",
  "modelFocusSelection",
] as const satisfies readonly ShortcutActionId[];

export type ShortcutGroupId =
  | "editing"
  | "views"
  | "plan"
  | "model"
  | "tools";

export const SHORTCUT_GROUP_LABELS: Record<ShortcutGroupId, string> = {
  editing: "Editing",
  views: "App views",
  plan: "Plan / Interiors",
  model: "3D camera (canvas focused)",
  tools: "Tools & help",
};

export const SHORTCUT_ACTION_GROUPS: Record<ShortcutActionId, ShortcutGroupId> = {
  undo: "editing",
  redo: "editing",
  save: "editing",
  new: "editing",
  copy: "editing",
  paste: "editing",
  duplicate: "editing",
  selectAll: "editing",
  remove: "editing",
  rotate90: "editing",
  viewPlan: "views",
  viewFront: "views",
  viewSide: "views",
  view3d: "views",
  cycleWorkspace: "views",
  toggleToolRail: "views",
  toggleInspector: "views",
  draftSelect: "plan",
  draftNote: "plan",
  draftLeader: "plan",
  toggleGrid: "plan",
  cycleSnap: "plan",
  measureTool: "plan",
  hideSelectedWall: "plan",
  showAllWalls: "plan",
  modelCamTop: "model",
  modelCamFront: "model",
  modelCamSide: "model",
  modelCamIsometric: "model",
  modelCamPerspective: "model",
  modelCamOrbit: "model",
  modelFitRoom: "model",
  modelFocusSelection: "model",
  openMaterial: "tools",
  commandPalette: "tools",
  shortcutHelp: "tools",
};

export const SHORTCUT_ACTION_LABELS: Record<ShortcutActionId, string> = {
  undo: "Undo",
  redo: "Redo",
  save: "Save project",
  new: "New project",
  copy: "Copy selection",
  paste: "Paste selection",
  duplicate: "Duplicate selection",
  selectAll: "Select all",
  remove: "Remove selection",
  commandPalette: "Command palette",
  shortcutHelp: "Shortcut help",
  viewPlan: "Plan view",
  viewFront: "Front elevation",
  viewSide: "Side elevation",
  view3d: "3D view",
  toggleToolRail: "Toggle tool rail",
  toggleInspector: "Toggle inspector",
  cycleWorkspace: "Cycle workspace view",
  draftSelect: "Drafting select tool",
  draftNote: "Drafting note tool",
  draftLeader: "Drafting leader tool",
  toggleGrid: "Toggle grid",
  rotate90: "Rotate selection 90°",
  cycleSnap: "Cycle snap size",
  measureTool: "Measure tool",
  hideSelectedWall: "Hide selected wall",
  showAllWalls: "Show all walls",
  modelCamTop: "3D Top (canvas focused)",
  modelCamFront: "3D Front (canvas focused)",
  modelCamSide: "3D Side (canvas focused)",
  modelCamIsometric: "3D Isometric (canvas focused)",
  modelCamPerspective: "3D Perspective (canvas focused)",
  modelCamOrbit: "3D Orbit (canvas focused)",
  modelFitRoom: "3D Fit room (canvas focused)",
  modelFocusSelection: "3D Focus selection (canvas focused)",
  openMaterial: "Open material browser",
};

export const DEFAULT_SHORTCUT_MAP: ShortcutMap = {
  undo: { key: "z", meta: true, ctrl: true },
  redo: { key: "z", meta: true, ctrl: true, shift: true },
  save: { key: "s", meta: true, ctrl: true },
  new: { key: "n", meta: true, ctrl: true },
  copy: { key: "c", meta: true, ctrl: true },
  paste: { key: "v", meta: true, ctrl: true },
  duplicate: { key: "d", meta: true, ctrl: true },
  selectAll: { key: "a", meta: true, ctrl: true },
  remove: { key: "Delete" },
  commandPalette: { key: "k", meta: true, ctrl: true },
  shortcutHelp: { key: "?" },
  viewPlan: { key: "1", meta: true, ctrl: true },
  viewFront: { key: "2", meta: true, ctrl: true },
  viewSide: { key: "3", meta: true, ctrl: true },
  view3d: { key: "4", meta: true, ctrl: true },
  toggleToolRail: { key: "[", meta: true, ctrl: true },
  toggleInspector: { key: "]", meta: true, ctrl: true },
  cycleWorkspace: { key: "Tab", meta: true, ctrl: true },
  draftSelect: { key: "v" },
  draftNote: { key: "n" },
  draftLeader: { key: "l" },
  toggleGrid: { key: "g" },
  rotate90: { key: "r" },
  cycleSnap: { key: "s", shift: true },
  measureTool: { key: "m" },
  hideSelectedWall: { key: "h", alt: true },
  showAllWalls: { key: "h", alt: true, shift: true },
  modelCamTop: { key: "1" },
  modelCamFront: { key: "2" },
  modelCamSide: { key: "3" },
  modelCamIsometric: { key: "4" },
  modelCamPerspective: { key: "5" },
  modelCamOrbit: { key: "o" },
  modelFitRoom: { key: "f" },
  modelFocusSelection: { key: "f", shift: true },
  openMaterial: { key: "b" },
};

/** Mouse / gesture bindings shown in the sheet (not remappable). */
export const SHORTCUT_FIXED_REFERENCES: ReadonlyArray<{
  id: string;
  label: string;
  keys: string;
  group: ShortcutGroupId;
}> = [
  { id: "pan-space", label: "Temporary pan (plan)", keys: "Space + drag", group: "plan" },
  { id: "pan-mmb", label: "Pan", keys: "Middle mouse", group: "plan" },
  { id: "nudge", label: "Nudge selection", keys: "Arrow keys", group: "editing" },
  { id: "clear", label: "Cancel tool / clear selection", keys: "Esc", group: "editing" },
  { id: "orbit-drag", label: "Orbit camera", keys: "Drag in 3D", group: "model" },
  { id: "zoom-wheel", label: "Zoom", keys: "Scroll wheel", group: "model" },
  { id: "plan-1", label: "Interiors → 2D plan", keys: "1 (3D unfocused)", group: "plan" },
  { id: "plan-2", label: "Interiors → 3D model", keys: "2 (3D unfocused)", group: "plan" },
];

export function shortcutActionsInGroup(group: ShortcutGroupId): ShortcutActionId[] {
  return (Object.keys(SHORTCUT_ACTION_GROUPS) as ShortcutActionId[])
    .filter((id) => SHORTCUT_ACTION_GROUPS[id] === group);
}
