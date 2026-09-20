import type { ExtractionResult, ExtractScaleTrust, ScaleTrustStatus } from "./types";

const STATUSES: readonly ScaleTrustStatus[] = ["unknown", "assumed", "calibrated"];

export function parseExtractScale(raw: unknown): ExtractScaleTrust {
  if (!raw || typeof raw !== "object") throw new Error("scale must be an object");
  const s = raw as Record<string, unknown>;
  if (!STATUSES.includes(s.status as ScaleTrustStatus)) {
    throw new Error(`Unsupported scale.status: ${String(s.status)}`);
  }
  const trust: ExtractScaleTrust = { status: s.status as ScaleTrustStatus };
  if (s.source != null) {
    if (typeof s.source !== "string") throw new Error("scale.source must be a string");
    trust.source = s.source;
  }
  if (s.referenceLengthMm != null) {
    if (typeof s.referenceLengthMm !== "number" || !Number.isFinite(s.referenceLengthMm)) {
      throw new Error("scale.referenceLengthMm must be a finite number");
    }
    trust.referenceLengthMm = s.referenceLengthMm;
  }
  return trust;
}

export function resolveScaleTrust(draft: ExtractionResult): ExtractScaleTrust {
  return draft.scale ?? { status: "unknown" };
}

export function scaleTrustAllowsApply(trust: ExtractScaleTrust): boolean {
  return trust.status === "calibrated";
}

export function markScaleAssumed(draft: ExtractionResult, source: string): ExtractionResult {
  if (draft.scale?.status === "calibrated") return draft;
  return { ...draft, scale: { status: "assumed", source } };
}

export function markScaleCalibrated(
  draft: ExtractionResult,
  extra?: { source?: string; referenceLengthMm?: number },
): ExtractionResult {
  return {
    ...draft,
    scale: {
      status: "calibrated",
      source: extra?.source ?? "user_reference",
      ...(extra?.referenceLengthMm != null ? { referenceLengthMm: extra.referenceLengthMm } : {}),
    },
  };
}

/**
 * Fresh extract only. Sidecar `scale` is not millwork trust — always stamp
 * assumed/unknown. Reopen a saved user-calibrated draft without this helper.
 */
export function stampImportWallsScale(
  draft: ExtractionResult,
  usedAssumedPixelScale: boolean,
): ExtractionResult {
  if (usedAssumedPixelScale) {
    return { ...draft, scale: { status: "assumed", source: "dxf_insunits" } };
  }
  return { ...draft, scale: { status: "unknown", source: "unspecified" } };
}
