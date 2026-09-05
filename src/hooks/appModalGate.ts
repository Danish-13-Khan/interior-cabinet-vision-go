/** Track in-app modal depth so editor shortcuts can ignore keys while dialogs are open. */
let openModalCount = 0;

export function isAppModalOpen() {
  return openModalCount > 0;
}

export function beginAppModal() {
  openModalCount += 1;
  return () => {
    openModalCount = Math.max(0, openModalCount - 1);
  };
}

function isTypingTarget(target: EventTarget | null) {
  if (!target || typeof target !== "object") return false;
  if (typeof HTMLInputElement !== "undefined" && target instanceof HTMLInputElement) return true;
  if (typeof HTMLTextAreaElement !== "undefined" && target instanceof HTMLTextAreaElement) return true;
  if (typeof HTMLSelectElement !== "undefined" && target instanceof HTMLSelectElement) return true;
  if (typeof HTMLElement !== "undefined" && target instanceof HTMLElement && target.isContentEditable) {
    return true;
  }
  // Duck-type so prompt inputs still count under Node vitest (no jsdom) and SSR-safe checks.
  const el = target as { tagName?: string; isContentEditable?: boolean };
  const tag = el.tagName?.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable === true;
}

const NATIVE_TEXT_EDIT_KEYS = new Set(["c", "v", "x", "a", "z", "y"]);
const WORKSPACE_MOD_KEYS = new Set(["s", "n", "d"]);

/** True for workspace editor shortcuts that must not leak through an open dialog. */
export function isEditorShortcutKey(event: KeyboardEvent, options?: { allowTypingDefaults?: boolean }) {
  const typing = isTypingTarget(event.target);
  const allowTyping = Boolean(options?.allowTypingDefaults && typing);

  if (event.key === "Escape") return true;

  const mod = event.metaKey || event.ctrlKey;
  if (mod) {
    const key = event.key.toLowerCase();
    // When focus is in an input/textarea, allow native cut/copy/paste/select-all/undo/redo.
    // Still block workspace commands (Save / New / Duplicate) even while typing.
    if (allowTyping && NATIVE_TEXT_EDIT_KEYS.has(key)) {
      return false;
    }
    if (
      NATIVE_TEXT_EDIT_KEYS.has(key)
      || WORKSPACE_MOD_KEYS.has(key)
    ) {
      return true;
    }
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    if (allowTyping) return false;
    return true;
  }

  if (typing) return false;

  if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown") {
    return true;
  }
  if (!mod && (event.key === "r" || event.key === "R" || event.key === "[" || event.key === "]")) {
    return true;
  }
  if (!mod && (event.key === "1" || event.key === "2")) {
    return true;
  }
  return false;
}
