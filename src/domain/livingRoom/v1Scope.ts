/** Product-boundary contract used to prevent parity creep during v1 polish. */
export const V1_PRODUCT_SCOPE = {
  differentiator: "millwork-design-on-2d-plan",
  assetStrategy: "curated-local-library",
  maxCuratedCatalogItems: 50,
  deferredCapabilities: [
    "styleboards",
    "autostyler",
    "object-marketplace",
    "ai-floor-plan-recognition",
  ],
} as const;

export function assertV1CatalogScope(itemCount: number) {
  if (!Number.isInteger(itemCount) || itemCount < 0) {
    throw new Error("Catalog item count must be a non-negative integer.");
  }
  if (itemCount > V1_PRODUCT_SCOPE.maxCuratedCatalogItems) {
    throw new Error(
      `V1 curated catalog exceeds ${V1_PRODUCT_SCOPE.maxCuratedCatalogItems} items; move expansion to the marketplace phase.`,
    );
  }
}
