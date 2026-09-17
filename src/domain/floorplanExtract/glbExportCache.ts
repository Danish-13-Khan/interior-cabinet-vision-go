import { floorplanApiBase } from "./config";
import { fingerprintFloorplanGlbRequest } from "./glbExportFingerprint";
import { assertGlbBlob } from "./glbMagic";
import { withCallerAbort } from "./glbExportCacheAbort";
import {
  floorplanGlbQuery,
  mergeFloorplanGlbFlags,
  type FloorplanGlbExportFlags,
} from "./glbExportProfile";
import type { ExtractionResult } from "./types";

/** Max retained GLB blobs (LRU). Large meshes — keep this small. */
export const FLOORPLAN_GLB_CACHE_LIMIT = 3;

export type FloorplanGlbHandle = {
  fingerprint: string;
  blob: Blob;
};

type CacheRecord = {
  fingerprint: string;
  blob: Blob;
  objectUrl: string | null;
  urlLeases: number;
  lastUsed: number;
};

type InflightSlot = {
  promise: Promise<FloorplanGlbHandle>;
  controller: AbortController;
  generation: number;
};

const memory = new Map<string, CacheRecord>();
const inflight = new Map<string, InflightSlot>();
let cacheGeneration = 0;
let lruClock = 0;

export type GetFloorplanGlbOptions = {
  signal?: AbortSignal;
  flags?: Partial<FloorplanGlbExportFlags>;
  apiBase?: string;
};

async function readExportError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

function touch(rec: CacheRecord) {
  rec.lastUsed = ++lruClock;
}

function revokeUrl(rec: CacheRecord) {
  if (rec.objectUrl) {
    URL.revokeObjectURL(rec.objectUrl);
    rec.objectUrl = null;
  }
  rec.urlLeases = 0;
}

function evictIfNeeded() {
  while (memory.size > FLOORPLAN_GLB_CACHE_LIMIT) {
    let victim: CacheRecord | null = null;
    for (const rec of memory.values()) {
      if (rec.urlLeases > 0) continue;
      if (!victim || rec.lastUsed < victim.lastUsed) victim = rec;
    }
    if (!victim) break;
    revokeUrl(victim);
    memory.delete(victim.fingerprint);
  }
}


async function fetchGlbBlob(
  draft: ExtractionResult,
  flags: FloorplanGlbExportFlags,
  apiBase: string,
  signal: AbortSignal,
): Promise<Blob> {
  const base = apiBase.replace(/\/$/, "");
  const res = await fetch(`${base}/export/glb?${floorplanGlbQuery(flags)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
    signal,
  });
  const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
  if (!res.ok || ctype.includes("application/json")) {
    throw new Error(await readExportError(res));
  }
  return assertGlbBlob(await res.blob());
}

/** Shared blob for Download + preview; object URLs via acquireFloorplanGlbObjectUrl. */
export async function getFloorplanGlb(
  draft: ExtractionResult,
  opts: GetFloorplanGlbOptions = {},
): Promise<FloorplanGlbHandle> {
  const apiBase = (opts.apiBase ?? floorplanApiBase()).replace(/\/$/, "");
  const flags = mergeFloorplanGlbFlags(opts.flags);
  const fingerprint = fingerprintFloorplanGlbRequest({ draft, apiBase, flags });

  const hit = memory.get(fingerprint);
  if (hit) {
    touch(hit);
    return { fingerprint: hit.fingerprint, blob: hit.blob };
  }

  let slot = inflight.get(fingerprint);
  if (!slot) {
    const generation = cacheGeneration;
    const controller = new AbortController();
    const promise = (async (): Promise<FloorplanGlbHandle> => {
      try {
        const blob = await fetchGlbBlob(draft, flags, apiBase, controller.signal);
        if (generation !== cacheGeneration) {
          throw new DOMException("Floor-plan GLB cache was cleared", "AbortError");
        }
        const rec: CacheRecord = {
          fingerprint,
          blob,
          objectUrl: null,
          urlLeases: 0,
          lastUsed: 0,
        };
        touch(rec);
        memory.set(fingerprint, rec);
        evictIfNeeded();
        return { fingerprint, blob };
      } finally {
        inflight.delete(fingerprint);
      }
    })();
    slot = { promise, controller, generation };
    inflight.set(fingerprint, slot);
  }

  return withCallerAbort(slot.promise, opts.signal);
}

export function peekFloorplanGlb(fingerprint: string): FloorplanGlbHandle | null {
  const hit = memory.get(fingerprint);
  if (!hit) return null;
  touch(hit);
  return { fingerprint: hit.fingerprint, blob: hit.blob };
}

/** Lazy object URL with reference counting. */
export function acquireFloorplanGlbObjectUrl(fingerprint: string): string {
  const hit = memory.get(fingerprint);
  if (!hit) throw new Error(`No cached floor-plan GLB for ${fingerprint}`);
  if (!hit.objectUrl) hit.objectUrl = URL.createObjectURL(hit.blob);
  hit.urlLeases += 1;
  touch(hit);
  return hit.objectUrl;
}

/** Drop one lease; revoke URL only when leases hit zero. */
export function releaseFloorplanGlbObjectUrl(fingerprint: string): void {
  const hit = memory.get(fingerprint);
  if (!hit || hit.urlLeases <= 0) return;
  hit.urlLeases -= 1;
  if (hit.urlLeases === 0) revokeUrl(hit);
}

/** Drop entry; throws if object-URL leases remain. */
export function releaseFloorplanGlb(fingerprint: string): void {
  const hit = memory.get(fingerprint);
  if (!hit) return;
  if (hit.urlLeases > 0) {
    throw new Error("Cannot release floor-plan GLB while object URL leases remain");
  }
  revokeUrl(hit);
  memory.delete(fingerprint);
}

/** Abort in-flight exports; bump generation so stale fills cannot repopulate. */
export function clearFloorplanGlbCache(): void {
  cacheGeneration += 1;
  for (const slot of inflight.values()) {
    slot.controller.abort();
  }
  inflight.clear();
  for (const rec of memory.values()) revokeUrl(rec);
  memory.clear();
}

/** Test/helper: current retained entry count. */
export function floorplanGlbCacheSize(): number {
  return memory.size;
}
