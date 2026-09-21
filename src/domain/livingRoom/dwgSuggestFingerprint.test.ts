import { describe, expect, it } from "vitest";
import { dwgSuggestGeometryFingerprint } from "./dwgSuggestFingerprint";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

const underlay: LivingRoomPlanUnderlay = {
  sourceType: "dwg",
  fileName: "room.dxf",
  dataUrl: "data:image/svg+xml,x",
  widthMm: 4000,
  heightMm: 3000,
  opacity: 0.4,
  xMm: 0,
  zMm: 0,
  rotationDeg: 0,
  calibrated: true,
};

function withHidden(names: string[]): LivingRoomPlanUnderlay {
  return {
    ...underlay,
    dwg: {
      hiddenLayers: names,
      preview: {
        bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
        layers: [],
        mmPerUnit: 1,
        rendered: 0,
        omitted: {},
        warnings: [],
        inserts: [],
      },
    },
  };
}

describe("DWG suggest geometry fingerprint", () => {
  it("changes when pose, scale, layers, or region change", () => {
    const base = dwgSuggestGeometryFingerprint(underlay, ["Walls"], null);
    expect(dwgSuggestGeometryFingerprint({ ...underlay, rotationDeg: 15 }, ["Walls"], null)).not.toBe(base);
    expect(dwgSuggestGeometryFingerprint({ ...underlay, xMm: 50 }, ["Walls"], null)).not.toBe(base);
    expect(dwgSuggestGeometryFingerprint({ ...underlay, widthMm: 4100 }, ["Walls"], null)).not.toBe(base);
    expect(dwgSuggestGeometryFingerprint(underlay, ["Doors"], null)).not.toBe(base);
    expect(dwgSuggestGeometryFingerprint(withHidden(["Notes"]), ["Walls"], null)).not.toBe(
      dwgSuggestGeometryFingerprint(withHidden([]), ["Walls"], null),
    );
    expect(dwgSuggestGeometryFingerprint(underlay, ["Walls"], {
      minX: 0, maxX: 100, minZ: 0, maxZ: 100,
    })).not.toBe(base);
  });

  it("ignores opacity and treats selected layer order as unsorted", () => {
    const left = dwgSuggestGeometryFingerprint(underlay, ["Doors", "Walls"], null);
    const faded = dwgSuggestGeometryFingerprint({ ...underlay, opacity: 0.9 }, ["Walls", "Doors"], null);
    expect(faded).toBe(left);
  });

  it("changes when source geometry, bounds, or underlay visibility change", () => {
    const shown = withHidden([]);
    const base = dwgSuggestGeometryFingerprint(shown, ["Walls"], null);
    expect(dwgSuggestGeometryFingerprint({ ...shown, hidden: true }, ["Walls"], null)).not.toBe(base);
    const moved = withHidden([]);
    moved.dwg = {
      ...moved.dwg!,
      preview: { ...moved.dwg!.preview, bounds: { minX: 0, minY: 0, maxX: 8, maxY: 8 } },
    };
    expect(dwgSuggestGeometryFingerprint(moved, ["Walls"], null)).not.toBe(base);
    const stroked = withHidden([]);
    stroked.dwg = {
      ...stroked.dwg!,
      preview: {
        ...stroked.dwg!.preview,
        layers: [{ name: "Walls", visible: true, paths: [{ d: "M0 0L10 0", matrix: [1, 0, 0, 1, 0, 0] }] }],
      },
    };
    expect(dwgSuggestGeometryFingerprint(stroked, ["Walls"], null)).not.toBe(base);
  });
});
