export {
  CLIENT_PRESENTATION_HONESTY_DISCLAIMER,
  RENDER_TIER_CATALOG,
  RENDER_TIER_LEGEND,
} from "./tierCatalog";
export { buildClientPresentationHonesty } from "./manifestHonesty";
export { resolveRenderStudioHonesty } from "./resolveStudioHonesty";
export {
  catalogEntryForRenderQuality,
  formatPackageHeroCaption,
  isPackageDeliverableRenderQuality,
  tierIdForRenderQuality,
} from "./tierForQuality";
export type {
  ClientPresentationHonesty,
  ClientPresentationTierNote,
  RenderHonestyDescription,
  RenderStudioView,
  RenderTierCatalogEntry,
  RenderTierId,
} from "./types";
