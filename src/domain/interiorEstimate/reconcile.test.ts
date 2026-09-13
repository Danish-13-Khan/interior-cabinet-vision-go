import { describe, expect, it } from "vitest";
import { buildOptionalBoqLine } from "../boq/optionalPacks";
import type { InteriorEstimateLine } from "./measure";
import { reconcileSurfaceCharges } from "./reconcile";

function line(partial: Partial<InteriorEstimateLine>): InteriorEstimateLine {
  return {
    id: "line", roomId: "room-1", roomName: "Living", label: "Wall finish — room face",
    source: "measured", category: "surface.wall", unit: "m2", measured: 10, quantity: 10,
    rate: 60, rateSource: "category", amount: 600, excluded: false, wastePercent: 0,
    ...partial,
  };
}

describe("reconcileSurfaceCharges", () => {
  it("finds no conflict when only geometry-derived surfaces are charged", () => {
    expect(reconcileSurfaceCharges([line({})])).toEqual([]);
  });

  it("flags a custom m² line that repeats a measured surface", () => {
    const conflicts = reconcileSurfaceCharges([
      line({}),
      line({ id: "manual:1", category: "manual", label: "Wall painting - 2 coats", unit: "m2" }),
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].category).toBe("surface.wall");
    expect(conflicts[0].kind).toBe("manual");
    expect(conflicts[0].lineIds).toEqual(["manual:1"]);
  });

  it("ignores a custom line in a different unit or unrelated wording", () => {
    const conflicts = reconcileSurfaceCharges([
      line({}),
      line({ id: "manual:1", category: "manual", label: "Wall painting", unit: "lm" }),
      line({ id: "manual:2", category: "manual", label: "Site cleaning", unit: "m2" }),
    ]);
    expect(conflicts).toEqual([]);
  });

  it("ignores an excluded surface line, so excluding one side resolves the conflict", () => {
    const conflicts = reconcileSurfaceCharges([
      line({ excluded: true }),
      line({ id: "manual:1", category: "manual", label: "Wall paint", unit: "m2" }),
    ]);
    expect(conflicts).toEqual([]);
  });

  it("flags an optional finish pack that charges an already measured surface", () => {
    const optional = buildOptionalBoqLine({ skuId: "finish.flooring", quantity: 12 });
    const conflicts = reconcileSurfaceCharges(
      [line({ id: "room:room-1:floor", category: "surface.floor", label: "Floor finish — whole room" })],
      [optional],
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].kind).toBe("optional-pack");
    expect(conflicts[0].lineIds).toEqual([optional.key]);
  });

  it("does not flag an optional fixture, which is a separate item from a surface", () => {
    const optional = buildOptionalBoqLine({ skuId: "fixture.sink", quantity: 1 });
    expect(reconcileSurfaceCharges([line({})], [optional])).toEqual([]);
  });
});
