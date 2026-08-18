import { describe, expect, it } from "vitest";
import { getCabinetMechanismState, mechanismAllPatch, mechanismFrontIndex } from "./cabinetMechanisms";
const object = { catalogItemId: "living:tv-unit", kind: "furniture", dimensions: { depthMm: 440 }, parameters: { doorCount: 3, mechanismOpen2: true } } as any;
describe("cabinet mechanisms", () => {
  it("uses independently persisted front states", () => { const state = getCabinetMechanismState(object)!; expect(state.open).toEqual([false, true, false]); expect(mechanismAllPatch(state, true)).toEqual({ mechanismOpen1: true, mechanismOpen2: true, mechanismOpen3: true }); });
  it("identifies procedural front primitives", () => { expect(mechanismFrontIndex("front-3")).toBe(2); expect(mechanismFrontIndex("handle-3")).toBeNull(); });
});
