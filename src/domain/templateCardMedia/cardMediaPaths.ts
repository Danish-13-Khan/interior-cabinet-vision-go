import { CARD_MEDIA } from "./cardMedia.generated";
import type { ApartmentTemplateId } from "../apartmentTemplates/types";
import type { CardMediaEntry, CardMediaVariantPaths, TemplateCardId } from "./types";

type CardMediaLookupId = TemplateCardId | ApartmentTemplateId;

/**
 * Manifest entry, or null when the template has no captured media yet. Pages
 * use this so one missing entry costs one card image, not the whole page.
 */
export function findCardMedia(id: CardMediaLookupId): CardMediaEntry | null {
  return CARD_MEDIA[id as TemplateCardId] ?? null;
}

/** Manifest entry only — no path guessing. Throws when missing (tests, scripts). */
export function cardMediaForTemplate(id: CardMediaLookupId): CardMediaEntry {
  const entry = findCardMedia(id);
  if (!entry) {
    throw new Error(`Missing CARD_MEDIA entry for ${id}. Run npm run media:cards.`);
  }
  return entry;
}

export type CatalogPosterRef =
  | { kind: "srcset"; poster: CardMediaVariantPaths }
  | { kind: "single"; src: string };

/** Catalog thumbnail: v2 pair for srcset, or a legacy single PNG. */
export function catalogPosterFromObjectKey(objectKey: string): CatalogPosterRef {
  if (objectKey.endsWith("-v2.webp")) {
    return {
      kind: "srcset",
      poster: {
        w800: objectKey,
        w1600: objectKey.replace(/-v2\.webp$/, "-v2-1600.webp"),
      },
    };
  }
  return { kind: "single", src: objectKey };
}

export function cardPosterSrcSet(poster: CardMediaVariantPaths, baseUrl: string): string {
  return `${baseUrl}${poster.w800} 800w, ${baseUrl}${poster.w1600} 1600w`;
}
