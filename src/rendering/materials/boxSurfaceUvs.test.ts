import { describe, expect, it } from "vitest";
import { BoxGeometry } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { applyBoxSurfaceUvs } from "./boxSurfaceUvs";
import { textureRepeatFromUvScaleMm } from "./materialScale";

describe("physical box surface texture scale", () => {
  for (const rounded of [false, true]) {
    it(`keeps a 600 mm tile square on every face (${rounded ? "rounded" : "plain"})`, () => {
      const geometry = rounded
        ? new RoundedBoxGeometry(1.2, 2.4, 0.6, 2, 0.002)
        : new BoxGeometry(1.2, 2.4, 0.6);
      applyBoxSurfaceUvs(geometry, { width: 1200, height: 2400, depth: 600 });
      const uv = geometry.getAttribute("uv");
      const repeats = textureRepeatFromUvScaleMm(600);
      const expected = [[1, 4], [1, 4], [2, 1], [2, 1], [2, 4], [2, 4]];
      geometry.groups.forEach((group, face) => {
        const us: number[] = [];
        const vs: number[] = [];
        for (let i = group.start; i < group.start + group.count; i++) {
          const vertex = geometry.index ? geometry.index.getX(i) : i;
          us.push(uv.getX(vertex) * repeats.x);
          vs.push(uv.getY(vertex) * repeats.y);
        }
        expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(expected[face][0], 2);
        expect(Math.max(...vs) - Math.min(...vs)).toBeCloseTo(expected[face][1], 2);
      });
      geometry.dispose();
    });
  }

  it("honours small tiles and large slabs without an artificial repeat clamp", () => {
    expect(textureRepeatFromUvScaleMm(50)).toEqual({ x: 20, y: 20 });
    expect(textureRepeatFromUvScaleMm(4000)).toEqual({ x: 0.25, y: 0.25 });
    for (const invalid of [0, -1, NaN, Infinity]) {
      expect(textureRepeatFromUvScaleMm(invalid)).toEqual({ x: 1, y: 1 });
    }
  });
});
