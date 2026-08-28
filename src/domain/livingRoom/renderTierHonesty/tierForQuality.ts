import type { RenderQuality } from "../../interiorProject";
import type { ClientPresentationManifest } from "../clientPresentation/buildPackageTypes";
import { RENDER_TIER_CATALOG } from "./tierCatalog";
import type { RenderTierId } from "./types";

export function tierIdForRenderQuality(quality: RenderQuality): RenderTierId {
  if (quality === "draft") return "draft-preview";
  if (quality === "standard") return "balanced-hero";
  return "client-preview-hero";
}

export function isPackageDeliverableRenderQuality(quality: string | undefined): boolean {
  return Boolean(quality && quality !== "draft");
}

export function catalogEntryForRenderQuality(quality: RenderQuality) {
  return RENDER_TIER_CATALOG.find((entry) => entry.tierId === tierIdForRenderQuality(quality))!;
}

export function formatPackageHeroCaption(
  render: NonNullable<ClientPresentationManifest["render"]>,
): string {
  const entry = catalogEntryForRenderQuality(render.quality as RenderQuality);
  return `${entry.headline} · ${render.cameraName} · ${render.widthPx}×${render.heightPx} · WebGL, not photoreal`;
}
