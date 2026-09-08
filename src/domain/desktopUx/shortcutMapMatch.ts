import type { ShortcutActionId, ShortcutBinding, ShortcutMap } from "./shortcutMap";

function normalizeEventKey(key: string) {
  if (key === "Backspace") return "Delete";
  if (key.length === 1) return key.toLowerCase();
  return key;
}

function bindingsEqual(a: ShortcutBinding, b: ShortcutBinding) {
  return (
    normalizeEventKey(a.key) === normalizeEventKey(b.key)
    && Boolean(a.meta || a.ctrl) === Boolean(b.meta || b.ctrl)
    && Boolean(a.shift) === Boolean(b.shift)
    && Boolean(a.alt) === Boolean(b.alt)
  );
}

export function formatShortcutBinding(binding: ShortcutBinding): string {
  const parts: string[] = [];
  if (binding.meta || binding.ctrl) parts.push("Cmd/Ctrl");
  if (binding.alt) parts.push("Alt");
  if (binding.shift) parts.push("Shift");
  const keyLabel = binding.key === " "
    ? "Space"
    : binding.key.length === 1
      ? binding.key.toUpperCase()
      : binding.key;
  parts.push(keyLabel);
  return parts.join("+");
}

export function eventMatchesBinding(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">,
  binding: ShortcutBinding,
): boolean {
  if (normalizeEventKey(event.key) !== normalizeEventKey(binding.key)) return false;
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
