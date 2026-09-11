import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode, RenderModeQuality } from "../../domain/livingRoom/renderAssetContracts";
import { anisotropyForRenderMode } from "../materials/materialScale";

/**
 * Curated map anisotropy — honor Model View modeQuality when present.
 * Studio (no override) keeps the hero/preview ladder.
 */
export function resolveCuratedMapAnisotropy(
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
): number {
  return anisotropyForRenderMode(mode, quality, modeQuality);
}

/** Prefer file normal; otherwise keep procedural bump even when albedo is curated. */
export function resolveCuratedBumpMap<T>(
  normalMap: T | undefined,
  proceduralBump: T | undefined,
): T | undefined {
  return normalMap ? undefined : proceduralBump;
}
