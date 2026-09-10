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
  | "measureTool"
  | "hideSelectedWall"
  | "showAllWalls"
  | "modelCamTop"
  | "modelCamFront"
  | "modelCamSide"
  | "modelCamIsometric"
  | "modelCamPerspective"
  | "modelCamOrbit"
  | "modelFitRoom"
  | "modelFocusSelection"
  | "openMaterial";

export type ShortcutBinding = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export type ShortcutMap = Record<ShortcutActionId, ShortcutBinding>;

export {
  DEFAULT_SHORTCUT_MAP,
  MODEL_VIEW_SHORTCUT_ACTION_IDS,
  SHORTCUT_ACTION_GROUPS,
  SHORTCUT_ACTION_LABELS,
  SHORTCUT_FIXED_REFERENCES,
  SHORTCUT_GROUP_LABELS,
  shortcutActionsInGroup,
  type ShortcutGroupId,
} from "./shortcutMapCatalog";

import { DEFAULT_SHORTCUT_MAP } from "./shortcutMapCatalog";

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
