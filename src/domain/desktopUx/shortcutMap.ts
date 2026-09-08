export const SHORTCUT_MAP_STORAGE_KEY = "cabinet-designer-shortcut-map";

export type ShortcutActionId =
  | "undo"
  | "redo"
  | "save"
  | "new"
  | "copy"
  | "paste"
  | "duplicate"
  | "selectAll"
  | "remove"
  | "commandPalette"
  | "shortcutHelp"
  | "viewPlan"
  | "viewFront"
  | "viewSide"
  | "view3d"
  | "toggleToolRail"
  | "toggleInspector"
  | "cycleWorkspace"
  | "draftSelect"
  | "draftNote"
  | "draftLeader"
  | "toggleGrid"
  | "rotate90"
  | "cycleSnap"
  | "modelCamTop"
  | "modelCamFront"
  | "modelCamSide"
  | "modelCamIsometric"
  | "modelCamPerspective"
  | "modelFitRoom"
  | "modelFocusSelection"
  | "openMaterial";

/** Fired only while the 3D model canvas has keyboard focus (not via global editor shortcuts). */
export const MODEL_VIEW_SHORTCUT_ACTION_IDS = [
  "modelCamTop",
  "modelCamFront",
  "modelCamSide",
  "modelCamIsometric",
  "modelCamPerspective",
  "modelFitRoom",
  "modelFocusSelection",
] as const satisfies readonly ShortcutActionId[];

export type ShortcutBinding = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export type ShortcutMap = Record<ShortcutActionId, ShortcutBinding>;

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
  modelCamTop: "3D Top (canvas focused)",
  modelCamFront: "3D Front (canvas focused)",
  modelCamSide: "3D Side (canvas focused)",
  modelCamIsometric: "3D Isometric (canvas focused)",
  modelCamPerspective: "3D Perspective (canvas focused)",
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
  modelCamTop: { key: "1" },
  modelCamFront: { key: "2" },
  modelCamSide: { key: "3" },
  modelCamIsometric: { key: "4" },
  modelCamPerspective: { key: "5" },
  modelFitRoom: { key: "f" },
  modelFocusSelection: { key: "f", shift: true },
  openMaterial: { key: "b" },
};

export function clampShortcutBinding(
  value: Partial<ShortcutBinding> | null | undefined,
  fallback: ShortcutBinding,
): ShortcutBinding {
  const key = typeof value?.key === "string" && value.key.length > 0 ? value.key : fallback.key;
  return {
    key,
    meta: Boolean(value?.meta ?? fallback.meta),
    ctrl: Boolean(value?.ctrl ?? fallback.ctrl),
    shift: Boolean(value?.shift ?? fallback.shift),
    alt: Boolean(value?.alt ?? fallback.alt),
  };
}

export function clampShortcutMap(
  value: Partial<Record<ShortcutActionId, Partial<ShortcutBinding>>> | null | undefined,
): ShortcutMap {
  const next = { ...DEFAULT_SHORTCUT_MAP };
  (Object.keys(DEFAULT_SHORTCUT_MAP) as ShortcutActionId[]).forEach((id) => {
    next[id] = clampShortcutBinding(value?.[id], DEFAULT_SHORTCUT_MAP[id]);
  });
  return next;
}

export function readShortcutMap(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined" ? window.localStorage : null,
): ShortcutMap {
  if (!storage) return { ...DEFAULT_SHORTCUT_MAP };
  try {
    const raw = storage.getItem(SHORTCUT_MAP_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SHORTCUT_MAP };
    return clampShortcutMap(
      JSON.parse(raw) as Partial<Record<ShortcutActionId, Partial<ShortcutBinding>>>,
    );
  } catch {
    return { ...DEFAULT_SHORTCUT_MAP };
  }
}

export function persistShortcutMap(
  map: ShortcutMap,
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined" ? window.localStorage : null,
) {
  if (!storage) return;
  storage.setItem(SHORTCUT_MAP_STORAGE_KEY, JSON.stringify(clampShortcutMap(map)));
}

export {
  bindingFromKeyboardEvent,
  eventMatchesBinding,
  findShortcutConflicts,
  formatShortcutBinding,
} from "./shortcutMapMatch";
