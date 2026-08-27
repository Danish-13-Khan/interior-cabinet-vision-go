import { describe, expect, it } from "vitest";
import { LIVING_ROOM_CATALOG } from "./catalog";
import { assertV1CatalogScope, V1_PRODUCT_SCOPE } from "./v1Scope";

describe("Phase G v1 scope contract", () => {
  it("keeps millwork on plan and deferred parity features out of v1", () => {
    expect(V1_PRODUCT_SCOPE.differentiator).toBe("millwork-design-on-2d-plan");
    expect(V1_PRODUCT_SCOPE.deferredCapabilities).toEqual([
      "styleboards", "autostyler", "object-marketplace", "ai-floor-plan-recognition",
    ]);
  });

  it("enforces the curated catalog ceiling when the catalog module loads", () => {
    expect(LIVING_ROOM_CATALOG.length).toBeLessThanOrEqual(V1_PRODUCT_SCOPE.maxCuratedCatalogItems);
    expect(() => assertV1CatalogScope(LIVING_ROOM_CATALOG.length)).not.toThrow();
  });

  it("rejects marketplace-sized catalog creep", () => {
    expect(() => assertV1CatalogScope(51)).toThrow("marketplace phase");
  });
});
