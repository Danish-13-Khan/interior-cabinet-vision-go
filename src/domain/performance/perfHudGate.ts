import { parseCameraDebugFlag } from "../orbit/cameraDebug";

export const PERF_HUD_STORAGE_KEY = "cabinet.perfTab";
export const PERF_HUD_QUERY_PARAM = "perf";

export function parsePerfAllowlist(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function flagFromSearch(search: string | null | undefined): boolean | null {
  if (!search) return null;
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    if (!params.has(PERF_HUD_QUERY_PARAM)) return null;
    const raw = params.get(PERF_HUD_QUERY_PARAM);
    return raw == null || raw === "" ? true : parseCameraDebugFlag(raw);
  } catch {
    return null;
  }
}

/** Menu row exists only when the flag is on and the account email is allowlisted. */
export function resolvePerformanceHudAllowed(input: {
  search?: string | null;
  storageValue?: string | null;
  email?: string | null;
  allowlist?: readonly string[] | null;
}): boolean {
  const fromSearch = flagFromSearch(input.search);
  const flag = fromSearch ?? parseCameraDebugFlag(input.storageValue);
  if (!flag) return false;
  const email = input.email?.trim().toLowerCase() ?? "";
  if (!email) return false;
  return (input.allowlist ?? []).includes(email);
}
