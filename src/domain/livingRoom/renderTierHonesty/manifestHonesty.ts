import type { ClientPresentationManifest } from "../clientPresentation/buildPackageTypes";
import { CLIENT_PRESENTATION_HONESTY_DISCLAIMER, RENDER_TIER_CATALOG } from "./tierCatalog";
import {
  isPackageDeliverableRenderQuality,
  tierIdForRenderQuality,
} from "./tierForQuality";
import type { ClientPresentationHonesty, RenderTierId } from "./types";
import type { RenderQuality } from "../../interiorProject";

function catalogEntry(tierId: RenderTierId) {
  return RENDER_TIER_CATALOG.find((entry) => entry.tierId === tierId)!;
}

/** Record which presentation tiers appear in an exported client package. */
export function buildClientPresentationHonesty(
  manifest: Pick<ClientPresentationManifest, "render" | "acceptedStills" | "files">,
  heroFileName: string | null,
): ClientPresentationHonesty {
  const tiers = [];
  if (
    manifest.render
    && heroFileName
    && isPackageDeliverableRenderQuality(manifest.render.quality)
  ) {
    const tierId = tierIdForRenderQuality(manifest.render.quality as RenderQuality);
    const entry = catalogEntry(tierId);
    tiers.push({
      tierId: entry.tierId,
      headline: entry.headline,
      subline: entry.subline,
      assets: [heroFileName],
    });
  }
  if (manifest.acceptedStills.length) {
    const entry = catalogEntry("hybrid-still");
    tiers.push({
      tierId: entry.tierId,
      headline: entry.headline,
      subline: entry.subline,
      assets: manifest.acceptedStills.flatMap((still) => (
        still.stillOutputPath ? [still.stillOutputPath] : []
      )),
    });
  }
  return {
    disclaimer: CLIENT_PRESENTATION_HONESTY_DISCLAIMER,
    tiers,
  };
}
