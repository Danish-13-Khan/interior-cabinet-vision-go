/** Keys that once stored the removed Calm/Compact layout choice. */
export const INTERIORS_UI_MODE_STORAGE_KEY = "cabinet-studio-interiors-ui-mode";
export const MARKETING_THEME_STORAGE_KEY = "cabinetStudioTheme";
const RETIRED_LAYOUT_VALUE = "compact";

type LayoutStorage = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): LayoutStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Read-time migration: a stored retired layout value becomes `calm`. */
export function migrateStoredLayoutPreference(
  key: string,
  storage: LayoutStorage | null = defaultStorage(),
): "calm" {
  try {
    if (storage?.getItem(key) === RETIRED_LAYOUT_VALUE) storage.setItem(key, "calm");
  } catch {
    // Private or locked-down browsers can reject localStorage; nothing to migrate.
  }
  return "calm";
}

export function migrateRetiredLayoutPreferences(storage: LayoutStorage | null = defaultStorage()) {
  migrateStoredLayoutPreference(INTERIORS_UI_MODE_STORAGE_KEY, storage);
  migrateStoredLayoutPreference(MARKETING_THEME_STORAGE_KEY, storage);
}
