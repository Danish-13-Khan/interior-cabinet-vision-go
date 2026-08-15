import { BoxGeometry, Mesh } from "three";
import { describe, expect, it } from "vitest";
import { computeGlbScaleFactors } from "../../domain/livingRoom/glbScale";
import {
  measureObjectSizeMeters,
  measureUnscaledObjectSizeMeters,
} from "./measureObjectBounds";

describe("GLB size measurement", () => {
  it("does not compound scale when the instance is already sized to target", () => {
    const mesh = new Mesh(new BoxGeometry(2.2, 0.82, 0.92));
    mesh.scale.set(2, 1, 1);
    mesh.updateWorldMatrix(true, true);
    const target = { widthMm: 2200, heightMm: 820, depthMm: 920 };
    const compounded = computeGlbScaleFactors(target, measureObjectSizeMeters(mesh));
    const unscaled = computeGlbScaleFactors(target, measureUnscaledObjectSizeMeters(mesh));
    expect(compounded.x).toBeCloseTo(0.5, 5);
    expect(unscaled.x).toBeCloseTo(1, 5);
    expect(unscaled.y).toBeCloseTo(1, 5);
    expect(mesh.scale.x).toBe(2);
  });
});
