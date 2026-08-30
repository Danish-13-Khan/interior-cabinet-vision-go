import { describe, expect, it } from "vitest";
import { createLivingRoomObject, LIVING_ROOM_CATALOG } from "./catalog";

describe("I4 curated millwork SKUs", () => {
  it("keeps a small SKU-bearing millwork set in the curated catalog", () => {
    const skus = LIVING_ROOM_CATALOG.flatMap((item) =>
      "sku" in item.parameters && typeof item.parameters.sku === "string" ? [item.parameters.sku] : [],
    );
    expect(skus).toEqual([
      "MW-TALL-600", "MW-BASE-900", "MW-WALL-900", "MW-DRAWER-900",
    ]);
  });

  it("copies the SKU into a placed cabinet's live parameters", () => {
    const cabinet = createLivingRoomObject("living:base-cabinet-900", {
      id: "base-1", roomId: "room-1", position: { x: 0, y: 0, z: 0 },
    });
    expect(cabinet.parameters.sku).toBe("MW-BASE-900");
    expect(cabinet.category).toBe("storage");
    expect(cabinet.extensions?.cabinetIdentity).toMatchObject({
      cabinetType: "base",
      familyId: "frameless-standard-base",
    });
  });
});
