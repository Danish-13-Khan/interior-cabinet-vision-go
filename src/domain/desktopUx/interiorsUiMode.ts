export type InteriorsUiMode = "calm" | "compact";

export const INTERIORS_UI_MODE_STORAGE_KEY = "cabinet-studio-interiors-ui-mode";

export function readInteriorsUiMode(storage: Pick<Storage, "getItem"> | null = typeof window === "undefined" ? null : window.localStorage): InteriorsUiMode {
  try {
    return storage?.getItem(INTERIORS_UI_MODE_STORAGE_KEY) === "compact" ? "compact" : "calm";
  } catch {
    return "calm";
  }
}

export function persistInteriorsUiMode(
  mode: InteriorsUiMode,
  storage: Pick<Storage, "setItem"> | null = typeof window === "undefined" ? null : window.localStorage,
) {
  try {
    storage?.setItem(INTERIORS_UI_MODE_STORAGE_KEY, mode);
  } catch {
    // A private or locked-down browser can reject localStorage. The in-memory
    // preference remains active for the current session.
  }
}

export function interiorsUiModeLabel(mode: InteriorsUiMode) {
  return mode === "compact" ? "Compact pro" : "Calm guided";
}
