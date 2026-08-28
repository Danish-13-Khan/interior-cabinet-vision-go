import type { RenderTierCatalogEntry } from "./types";

/** Canonical three tiers — Draft ≠ Client Preview ≠ Hybrid Still. */
export const RENDER_TIER_CATALOG: readonly RenderTierCatalogEntry[] = [
  {
    tierId: "draft-preview",
    headline: "Working Draft",
    subline: "Interactive viewport · fast iteration · never ships in client package",
    shortBadge: "DRAFT · PREVIEW",
    packageDeliverable: false,
  },
  {
    tierId: "balanced-hero",
    headline: "Balanced Preview Hero",
    subline: "WebGL hero export · intermediate quality · not Client Preview delivery",
    shortBadge: "STANDARD · HERO",
    packageDeliverable: true,
  },
  {
    tierId: "client-preview-hero",
    headline: "Client Preview Hero",
    subline: "WebGL hero export · package quality · not photoreal · not a hybrid still",
    shortBadge: "CLIENT PREVIEW · HERO",
    packageDeliverable: true,
  },
  {
    tierId: "hybrid-still",
    headline: "Hybrid Still",
    subline: "Faithful enhance · reviewed before package · does not edit the project",
    shortBadge: "STILL · FAITHFUL ENHANCE",
    packageDeliverable: true,
  },
] as const;

export const CLIENT_PRESENTATION_HONESTY_DISCLAIMER =
  "Presentation tiers are not interchangeable. Draft previews, WebGL hero renders, and accepted hybrid stills each have distinct trust rules.";

/** Primary three-tier story shown in Render Studio legend. */
export const RENDER_TIER_LEGEND = RENDER_TIER_CATALOG.filter(
  (entry) => entry.tierId !== "balanced-hero",
);
