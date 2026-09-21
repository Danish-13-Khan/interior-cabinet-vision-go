/**
 * Phase 4 — opt-in camera / viewer debug HUD.
 * Off by default. Enable with ?cameraDebug=1 or localStorage cabinet.cameraDebug=1.
 * Never forks product lighting or orbit product settings.
 */

export const CAMERA_DEBUG_STORAGE_KEY = "cabinet.cameraDebug";
export const CAMERA_DEBUG_QUERY_PARAM = "cameraDebug";

export type CameraDebugSnapshot = {
  canvas: "cabinet" | "model-view";
  screenSpacePanning: boolean;
  enableDamping: boolean;
  dampingFactor: number;
  distance: number | null;
  target: readonly [number, number, number] | null;
  polar: number | null;
  fps: number | null;
  frameMs: number | null;
  triangles: number | null;
  drawCalls: number | null;
  exposure: number | null;
  frameloop: string | null;
};

export function parseCameraDebugFlag(value: string | null | undefined): boolean {
  if (value == null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

/** Pure resolver — pass window-like pieces so tests stay headless. */
export function resolveCameraDebugEnabled(input: {
  search?: string | null;
  storageValue?: string | null;
}): boolean {
  if (input.search) {
    try {
      const params = new URLSearchParams(
        input.search.startsWith("?") ? input.search.slice(1) : input.search,
      );
      if (params.has(CAMERA_DEBUG_QUERY_PARAM)) {
        const raw = params.get(CAMERA_DEBUG_QUERY_PARAM);
        // bare ?cameraDebug counts as on
        return raw == null || raw === "" ? true : parseCameraDebugFlag(raw);
      }
    } catch {
      // ignore malformed search
    }
  }
  return parseCameraDebugFlag(input.storageValue);
}

export function readCameraDebugEnabledFromBrowser(
  win: Pick<Window, "location" | "localStorage"> | null | undefined = typeof window !== "undefined" ? window : null,
): boolean {
  if (!win) return false;
  let storageValue: string | null = null;
  try {
    storageValue = win.localStorage.getItem(CAMERA_DEBUG_STORAGE_KEY);
  } catch {
    storageValue = null;
  }
  return resolveCameraDebugEnabled({
    search: win.location?.search ?? null,
    storageValue,
  });
}

export function formatCameraDebugNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}
