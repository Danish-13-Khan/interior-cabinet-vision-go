import { floorplanApiBase } from "./config";

export type FloorplanSidecarStatus = {
  ok: boolean;
  version: string | null;
  service?: string;
  fetchedAt: number;
  apiBase: string;
};

let cached: FloorplanSidecarStatus | null = null;
let inflight: Promise<FloorplanSidecarStatus> | null = null;

const TTL_MS = 60_000;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
    || (error instanceof Error && error.name === "AbortError");
}

export function peekFloorplanSidecarVersion(): string | null {
  return cached?.version ?? null;
}

export function peekFloorplanSidecarStatus(): FloorplanSidecarStatus | null {
  return cached;
}

export function clearFloorplanSidecarStatusCache() {
  cached = null;
  inflight = null;
}

/** GET /readyz — caches version for GLB fingerprint when present (60s TTL). */
export async function fetchFloorplanSidecarStatus(opts?: {
  force?: boolean;
  apiBase?: string;
  signal?: AbortSignal;
}): Promise<FloorplanSidecarStatus> {
  const apiBase = (opts?.apiBase ?? floorplanApiBase()).replace(/\/$/, "");
  const now = Date.now();
  if (
    !opts?.force
    && cached
    && cached.apiBase === apiBase
    && now - cached.fetchedAt < TTL_MS
  ) {
    return cached;
  }
  if (!opts?.force && inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(`${apiBase}/readyz`, { signal: opts?.signal });
      if (!res.ok) {
        cached = { ok: false, version: null, fetchedAt: Date.now(), apiBase };
        return cached;
      }
      const j = (await res.json()) as { ok?: boolean; version?: string; service?: string };
      const version = typeof j.version === "string" && j.version.trim() ? j.version.trim() : null;
      cached = {
        ok: Boolean(j.ok),
        version,
        service: typeof j.service === "string" ? j.service : undefined,
        fetchedAt: Date.now(),
        apiBase,
      };
      return cached;
    } catch (error) {
      // Do not poison the TTL cache with aborted probes.
      if (isAbortError(error)) {
        if (cached && cached.apiBase === apiBase) return cached;
        return { ok: false, version: null, fetchedAt: 0, apiBase };
      }
      cached = { ok: false, version: null, fetchedAt: Date.now(), apiBase };
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
