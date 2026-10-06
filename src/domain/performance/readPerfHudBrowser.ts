import { readCameraDebugEnabledFromBrowser } from "../orbit/cameraDebug";
import { readLocalAccount } from "../saas/accountPersistence";
import { PERF_HUD_STORAGE_KEY, parsePerfAllowlist, resolvePerformanceHudAllowed } from "./perfHudGate";

type BrowserBits = Pick<Window, "location" | "localStorage">;

/** Flag plus the local account email. Headless callers pass the pieces in. */
export function readPerformanceHudAllowedFromBrowser(
  win: BrowserBits | null | undefined = typeof window !== "undefined" ? window : null,
  allowlistRaw: string | null | undefined = import.meta.env?.VITE_PERF_USER_IDS as string | undefined,
): boolean {
  if (!win) return false;
  let storageValue: string | null = null;
  try {
    storageValue = win.localStorage.getItem(PERF_HUD_STORAGE_KEY);
  } catch {
    storageValue = null;
  }
  return resolvePerformanceHudAllowed({
    search: win.location?.search ?? null,
    storageValue,
    email: readLocalAccount(win.localStorage)?.email ?? null,
    allowlist: parsePerfAllowlist(allowlistRaw),
  });
}

export function readPerfHudDebugStart(
  win: BrowserBits | null | undefined = typeof window !== "undefined" ? window : null,
): boolean {
  return readCameraDebugEnabledFromBrowser(win);
}
