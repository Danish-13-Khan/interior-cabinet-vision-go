import { describe, expect, it } from "vitest";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import {
  canCarryUnderlayPose,
  canMoveUnderlay,
  carryUnderlayPose,
  describeUnderlayReplace,
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

  describe("carryUnderlayPose (Replace file)", () => {
    const calibrated: LivingRoomPlanUnderlay = {
      ...base, widthMm: 7400, heightMm: 5550, xMm: 320, zMm: -180, rotationDeg: -90, opacity: 0.3, calibrated: true,
    };
    const fresh: LivingRoomPlanUnderlay = {
      fileName: "rescan.png", dataUrl: "data:image/png;base64,BBBB", widthMm: 6200, heightMm: 4650, opacity: 0.42,
      xMm: 0, zMm: 0, rotationDeg: 0, calibrated: false, importWidthMm: 6200, importHeightMm: 4650,
    };

    it("keeps size, pose, opacity and calibration when the aspect matches", () => {
      const carried = carryUnderlayPose(calibrated, fresh);
      expect(carried.fileName).toBe("rescan.png");
      expect(carried.dataUrl).toBe(fresh.dataUrl);
      expect(carried.widthMm).toBe(7400);
      expect(carried.heightMm).toBe(5550);
      expect(carried.xMm).toBe(320);
      expect(carried.zMm).toBe(-180);
      expect(carried.rotationDeg).toBe(-90);
      expect(carried.opacity).toBe(0.3);
      expect(carried.calibrated).toBe(true);
      expect(carried.importWidthMm).toBe(6200);
    });

    it("returns the fresh import when the aspect differs by more than 1 %", () => {
      expect(canCarryUnderlayPose(calibrated, fresh)).toBe(true);
      expect(canCarryUnderlayPose(calibrated, { ...fresh, heightMm: 4000 })).toBe(false);
      expect(carryUnderlayPose(calibrated, { ...fresh, heightMm: 4000 })).toEqual({ ...fresh, heightMm: 4000 });
    });

    it("describes a replace as kept, reset or plain for DWG", () => {
      expect(describeUnderlayReplace(calibrated, fresh)).toMatch(/kept/);
      expect(describeUnderlayReplace(calibrated, { ...fresh, heightMm: 4000 })).toMatch(/reset.*Calibrate again/);
      expect(describeUnderlayReplace(calibrated, { ...fresh, sourceType: "dwg" })).toBe("Replaced plan underlay.");
    });

    it("never carries a pose onto or from a DWG underlay, or when nothing was there", () => {
      expect(carryUnderlayPose(null, fresh)).toBe(fresh);
      expect(carryUnderlayPose({ ...calibrated, sourceType: "dwg" }, fresh)).toBe(fresh);
      expect(carryUnderlayPose(calibrated, { ...fresh, sourceType: "dwg" }).calibrated).toBe(false);
    });
  });
});
