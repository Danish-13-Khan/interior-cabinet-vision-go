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
  | "cycleWorkspace";

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
};

export function clampShortcutBinding(
  value: Partial<ShortcutBinding> | null | undefined,
  fallback: ShortcutBinding,
): ShortcutBinding {
  const key = typeof value?.key === "string" && value.key.length > 0
    ? value.key
    : fallback.key;
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

export function formatShortcutBinding(binding: ShortcutBinding): string {
  const parts: string[] = [];
  if (binding.meta || binding.ctrl) parts.push("Cmd/Ctrl");
  if (binding.alt) parts.push("Alt");
  if (binding.shift) parts.push("Shift");
  const keyLabel =
    binding.key === " " ? "Space" : binding.key.length === 1
      ? binding.key.toUpperCase()
      : binding.key;
  parts.push(keyLabel);
  return parts.join("+");
}

export function eventMatchesBinding(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">,
  binding: ShortcutBinding,
): boolean {
  const eventKey = normalizeEventKey(event.key);
  const bindingKey = normalizeEventKey(binding.key);
  if (eventKey !== bindingKey) return false;

  const wantsMod = Boolean(binding.meta || binding.ctrl);
  const hasMod = event.metaKey || event.ctrlKey;
  if (wantsMod !== hasMod) return false;
  if (Boolean(binding.shift) !== event.shiftKey) return false;
  if (Boolean(binding.alt) !== event.altKey) return false;
  return true;
}

export function bindingFromKeyboardEvent(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">,
): ShortcutBinding {
  return {
    key: normalizeEventKey(event.key),
    meta: event.metaKey,
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}

export function findShortcutConflicts(
  map: ShortcutMap,
  actionId: ShortcutActionId,
  binding: ShortcutBinding,
): ShortcutActionId[] {
  return (Object.keys(map) as ShortcutActionId[]).filter((id) => {
    if (id === actionId) return false;
    return bindingsEqual(map[id], binding);
  });
}

export function readShortcutMap(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
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
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
) {
  if (!storage) return;
  storage.setItem(SHORTCUT_MAP_STORAGE_KEY, JSON.stringify(clampShortcutMap(map)));
}

function bindingsEqual(a: ShortcutBinding, b: ShortcutBinding) {
  return (
    normalizeEventKey(a.key) === normalizeEventKey(b.key) &&
    Boolean(a.meta || a.ctrl) === Boolean(b.meta || b.ctrl) &&
    Boolean(a.shift) === Boolean(b.shift) &&
    Boolean(a.alt) === Boolean(b.alt)
  );
}

function normalizeEventKey(key: string) {
  if (key === "Backspace") return "Delete";
  if (key.length === 1) return key.toLowerCase();
  return key;
}
