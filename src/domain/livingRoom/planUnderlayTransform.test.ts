import { describe, expect, it } from "vitest";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import {
  canMoveUnderlay,
  centreUnderlayOnOrigin,
  normalizeUnderlayRotationDeg,
  rotateUnderlayBy,
  translateUnderlay,
} from "./planUnderlayTransform";

const base: LivingRoomPlanUnderlay = {
  fileName: "plan.pdf",
  dataUrl: "data:image/png;base64,AAAA",
  widthMm: 8000,
  heightMm: 6000,
  opacity: 0.5,
  xMm: 400,
  zMm: -250,
  rotationDeg: 0,
};

describe("plan underlay transform", () => {
  it("normalises rotation into (−180, 180]", () => {
    expect(normalizeUnderlayRotationDeg(270)).toBe(-90);
    expect(normalizeUnderlayRotationDeg(-270)).toBe(90);
    expect(normalizeUnderlayRotationDeg(180)).toBe(180);
    expect(normalizeUnderlayRotationDeg(-180)).toBe(180);
    expect(normalizeUnderlayRotationDeg(Number.NaN)).toBe(0);
  });

  it("turns a sideways plan upright in one step and keeps pan and scale", () => {
    const sideways = { ...base, rotationDeg: 90 };
    const upright = rotateUnderlayBy(sideways, -90);
    expect(upright.rotationDeg).toBe(0);
    expect(upright).toMatchObject({ xMm: 400, zMm: -250, widthMm: 8000, heightMm: 6000 });
    expect(rotateUnderlayBy({ ...base, rotationDeg: 135 }, 90).rotationDeg).toBe(-135);
  });

  it("keeps DWG layer state through rotation", () => {
    const dwg = { hiddenLayers: ["A-FURN"] } as unknown as LivingRoomPlanUnderlay["dwg"];
    const rotated = rotateUnderlayBy({ ...base, sourceType: "dwg", dwg }, 90);
    expect(rotated.dwg).toBe(dwg);
    expect(rotated.sourceType).toBe("dwg");
  });

  it("centres on origin without touching rotation", () => {
    const centred = centreUnderlayOnOrigin({ ...base, rotationDeg: 30 });
    expect(centred).toMatchObject({ xMm: 0, zMm: 0, rotationDeg: 30, widthMm: 8000 });
  });

  it("translates by a drag delta with whole-mm rounding", () => {
    expect(translateUnderlay(base, 100.4, 49.6)).toMatchObject({ xMm: 500, zMm: -200 });
  });

  it("blocks moves while locked or hidden", () => {
    expect(canMoveUnderlay(null)).toBe(false);
    expect(canMoveUnderlay(base)).toBe(true);
    expect(canMoveUnderlay({ ...base, locked: true })).toBe(false);
    expect(canMoveUnderlay({ ...base, hidden: true })).toBe(false);
  });
});
