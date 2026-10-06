/**
 * Card stills for an apartment template, relative to the public base URL.
 * Written by `npm run stills:apartments`; used by the marketing and
 * project-home cards. Kept free of spec imports so the marketing bundle stays
 * light.
 */
function stillParts(id: string) {
  const [, , slug = "unknown", version = "v1"] = id.split(":");
  return { slug, version };
}

/** The card image: the hero room from the Showcase tour, in daylight. */
export function apartmentStillPath(id: string): string {
  const { slug, version } = stillParts(id);
  return `catalog/templates/apartment-${slug}-${version}.webp`;
}

/** The second card image: the whole-apartment overview, shown on hover / focus. */
export function apartmentPlanStillPath(id: string): string {
  const { slug, version } = stillParts(id);
  return `catalog/templates/apartment-${slug}-plan-${version}.webp`;
}
