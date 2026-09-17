import type { ExtractionResult } from "./types";
import {
  FLOORPLAN_GLB_EXPORT_PROFILE_VERSION,
  floorplanGlbFlagsFingerprintPart,
  mergeFloorplanGlbFlags,
  type FloorplanGlbExportFlags,
} from "./glbExportProfile";

/** cyrb53 — small sync hash for cache keys (not crypto). */
export function hashFingerprintSeed(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return n.toString(16).padStart(14, "0");
}

export type FloorplanGlbFingerprintInput = {
  draft: ExtractionResult;
  apiBase: string;
  flags?: Partial<FloorplanGlbExportFlags>;
  /** Defaults to FLOORPLAN_GLB_EXPORT_PROFILE_VERSION. */
  profileVersion?: string;
  /** From GET /readyz when available (P3). Omitted from seed when null/undefined. */
  sidecarVersion?: string | null;
};

/**
 * Fingerprint of the exact export request:
 * normalized draft + ordered flags + API base + client export-profile version
 * + sidecar version when /readyz has exposed it (P3).
 */
export function fingerprintFloorplanGlbRequest(input: FloorplanGlbFingerprintInput): string {
  const flags = mergeFloorplanGlbFlags(input.flags);
  const profile = input.profileVersion ?? FLOORPLAN_GLB_EXPORT_PROFILE_VERSION;
  const base = input.apiBase.replace(/\/$/, "");
  const parts = [
    `profile:${profile}`,
    `base:${base}`,
    `flags:${floorplanGlbFlagsFingerprintPart(flags)}`,
    `draft:${JSON.stringify(input.draft)}`,
  ];
  const sidecar = input.sidecarVersion?.trim();
  if (sidecar) parts.splice(1, 0, `sidecar:${sidecar}`);
  return hashFingerprintSeed(parts.join("\n"));
}
