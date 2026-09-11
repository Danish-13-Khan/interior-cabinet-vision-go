import type { RenderQuality } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";

/**
 * GLB mesh shadow casting — additive Model View Standard on top of Studio hero.
 * Studio Draft stays preview/non-casting; all hero tiers keep casting.
 */
export function resolveGlbCastShadow(args: {
  renderMode: RenderMode;
  modelViewPreview?: boolean;
  modelViewQuality?: RenderQuality | null;
}): boolean {
  if (args.renderMode === "hero") return true;
  return Boolean(args.modelViewPreview && args.modelViewQuality === "standard");
}
