import { describe, expect, it } from "vitest";
import {
  shouldProjectDirectionalCast,
  shouldProjectFillCastShadow,
} from "./directionalCasterBudget";

describe("directionalCasterBudget", () => {
  it("allows all project directional casters when uncapped (Studio)", () => {
    expect(shouldProjectDirectionalCast(true, 0)).toBe(true);
    expect(shouldProjectDirectionalCast(true, 5)).toBe(true);
    expect(shouldProjectFillCastShadow()).toBe(true);
  });

  it("caps Model View Standard at two directional casters", () => {
    expect(shouldProjectDirectionalCast(true, 0, 2)).toBe(true);
    expect(shouldProjectDirectionalCast(true, 1, 2)).toBe(true);
    expect(shouldProjectDirectionalCast(true, 2, 2)).toBe(false);
    expect(shouldProjectDirectionalCast(false, 0, 2)).toBe(false);
  });

  it("disables fill map shadows when a Model View budget is active", () => {
    expect(shouldProjectFillCastShadow(1)).toBe(false);
    expect(shouldProjectFillCastShadow(2)).toBe(false);
  });
});
