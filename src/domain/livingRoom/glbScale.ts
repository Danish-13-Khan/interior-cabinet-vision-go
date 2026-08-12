import type { ModelNativeSizeMm } from "./renderAssetContracts";

export type Size3Meters = { x: number; y: number; z: number };

export type GlbScaleFactors = {
  x: number;
  y: number;
  z: number;
};

const EPSILON = 1e-6;

/** Convert millimetre native size into meters for Three.js bounds math. */
export function nativeSizeMmToMeters(size: ModelNativeSizeMm): Size3Meters {
  return {
    x: size.widthMm / 1000,
    y: size.heightMm / 1000,
    z: size.depthMm / 1000,
  };
}

/**
 * Non-uniform scale so a loaded GLB AABB matches InteriorProject object dimensions.
 * Prefer measured runtime bounds when provided; otherwise use packaged nativeSizeMm.
 */
export function computeGlbScaleFactors(
  targetSizeMm: ModelNativeSizeMm,
  sourceSizeM: Size3Meters,
): GlbScaleFactors {
  return {
    x: (targetSizeMm.widthMm / 1000) / Math.max(sourceSizeM.x, EPSILON),
    y: (targetSizeMm.heightMm / 1000) / Math.max(sourceSizeM.y, EPSILON),
    z: (targetSizeMm.depthMm / 1000) / Math.max(sourceSizeM.z, EPSILON),
  };
}

export function computeGlbScaleFromNativeSize(
  targetSizeMm: ModelNativeSizeMm,
  nativeSizeMm: ModelNativeSizeMm,
): GlbScaleFactors {
  return computeGlbScaleFactors(targetSizeMm, nativeSizeMmToMeters(nativeSizeMm));
}
