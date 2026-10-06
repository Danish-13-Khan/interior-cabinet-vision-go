/**
 * Showcase-tour still for an apartment template (its hero room at the tour's
 * first camera), relative to the public base URL. Written by
 * `npm run stills:apartments`; used by the marketing and project-home cards.
 * Kept free of spec imports so the marketing bundle stays light.
 */
export function apartmentStillPath(id: string): string {
  const [, , slug = "unknown", version = "v1"] = id.split(":");
  return `catalog/templates/apartment-${slug}-${version}.webp`;
}
