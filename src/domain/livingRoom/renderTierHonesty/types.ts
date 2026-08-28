import type { PresetHonestyDescription } from "../presetHonesty";

export type RenderTierId =
  | "draft-preview"
  | "balanced-hero"
  | "client-preview-hero"
  | "hybrid-still";

export type RenderStudioView = "preview" | "result" | "compare" | "still";

export type RenderHonestyDescription = PresetHonestyDescription & {
  tierId: RenderTierId;
};

export type RenderTierCatalogEntry = {
  tierId: RenderTierId;
  headline: string;
  subline: string;
  shortBadge: string;
  packageDeliverable: boolean;
};

export type ClientPresentationTierNote = {
  tierId: RenderTierId;
  headline: string;
  subline: string;
  assets: string[];
};

export type ClientPresentationHonesty = {
  disclaimer: string;
  tiers: ClientPresentationTierNote[];
};
