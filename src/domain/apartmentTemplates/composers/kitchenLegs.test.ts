import { describe, expect, it } from "vitest";
import { bareRoom } from "./bareRoom";
import { composeKitchen } from "./index";

describe("kitchen second runs (L / parallel)", () => {
  it("an L / parallel second run that cannot fit clear of the corner fails loudly", () => {
    // West wall: window leaves 2200 mm at the north corner; 600 mm clearance leaves 1600 < 2 bases.
    const tight = bareRoom("kitchen", 5000, 4200);
    expect(() => composeKitchen(tight, tight.activeRoomId, {
      layout: "L", runSide: "north", secondarySide: "west", wallCabinets: false,
    })).toThrow(/no free 1800 mm on the west wall/);
    expect(() => composeKitchen(tight, tight.activeRoomId, {
      layout: "parallel", runSide: "north", secondarySide: "east", wallCabinets: false,
    })).toThrow(/must face the north run/);
  });

  it("L legs clear the primary run at whichever end the corner is", () => {
    const bare = bareRoom("kitchen", 5000, 4800);
    for (const runSide of ["east", "west"] as const) {
      const next = composeKitchen(bare, bare.activeRoomId, {
        layout: "L", runSide, secondarySide: "north", wallCabinets: false, underCabinetLights: false,
      });
      const legs = next.objects.filter((o) => o.id.includes("-leg-"));
      const primary = next.objects.filter((o) => o.kind === "cabinet" && /-(base-a|drawer|base-b)$/.test(o.id));
      expect(legs.length, runSide).toBeGreaterThanOrEqual(2);
      // Primary run hugs the east / west wall; its front sits ≈ depth in from that wall.
      const primaryX = primary[0]!.position.x;
      const depth = primary[0]!.dimensions.depthMm;
      for (const leg of legs) {
        const gap = Math.abs(leg.position.x - primaryX) - leg.dimensions.widthMm / 2 - depth / 2;
        expect(gap, `${runSide} ${leg.id}`).toBeGreaterThanOrEqual(-1);
      }
    }
  });

});
