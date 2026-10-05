/**
 * Phase 0 / Phase 1 decisions (see docs/APARTMENT_TEMPLATES_ROADMAP.md).
 *
 * D2 spike: a 3 BHK shell with 10 guillotine cuts (including T-junctions)
 * validates with closed loops and zero repairs. Keep guillotine via
 * createWallSegment / splitRoomByWall. Do NOT switch to
 * applyFloorplanToInterior for apartment templates.
 *
 * Catalog cap (§1): reuse existing living:/catalog items through parameters
 * (wardrobe width, finish roles, composition options). Keep
 * assertV1CatalogScope at 50 until Phase 4 needs net-new SKUs such as a
 * dedicated shoe cabinet.
 */
export const APARTMENT_TEMPLATE_DECISIONS = {
  shellRoute: "guillotine" as const,
  catalogCap: "reuse-via-parameters" as const,
  catalogCapLimit: 50,
};
