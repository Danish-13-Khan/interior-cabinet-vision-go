import { describe, expect, it } from "vitest";
import { morphClean, otsuThreshold, thresholdToBinary } from "./cvBinaryMask";
import { findAxisWallSegments, inkBoundingBox } from "./cvAxisSegments";
import { extractWallsFromGray } from "./cvExtractWalls";
import { mergeCvWallsWithVision } from "./classicalCvHybrid";
import type { GrayBuffer } from "./geometryMode";
import { SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";

function makeRectGray(): GrayBuffer {
  const width = 120;
  const height = 100;
  const data = new Uint8Array(width * height);
  data.fill(240);
  function ink(x: number, y: number) {
    if (x >= 0 && y >= 0 && x < width && y < height) data[y * width + x] = 30;
  }
  for (let x = 15; x <= 105; x++) {
    for (let t = 0; t < 4; t++) {
      ink(x, 15 + t);
      ink(x, 82 + t);
    }
  }
  for (let y = 15; y <= 85; y++) {
    for (let t = 0; t < 4; t++) {
      ink(15 + t, y);
      ink(102 + t, y);
    }
  }
  return { width, height, data };
}

describe("cvBinaryMask", () => {
  it("otsu separates dark walls from light paper", () => {
    const gray = makeRectGray();
    const t = otsuThreshold(gray);
    expect(t).toBeGreaterThan(15);
    expect(t).toBeLessThan(220);
    const binary = morphClean(thresholdToBinary(gray, t));
    const box = inkBoundingBox(binary);
    expect(box).not.toBeNull();
    expect(box!.maxX - box!.minX).toBeGreaterThan(50);
  });
});

describe("findAxisWallSegments", () => {
  it("finds four sides of a rectangle mask", () => {
    const gray = makeRectGray();
    const binary = morphClean(thresholdToBinary(gray));
    const segs = findAxisWallSegments(binary, { minLengthPx: 20 });
    const h = segs.filter((s) => s.axis === "h");
    const v = segs.filter((s) => s.axis === "v");
    expect(h.length).toBeGreaterThanOrEqual(2);
    expect(v.length).toBeGreaterThanOrEqual(2);
  });
});

describe("extractWallsFromGray", () => {
  it("maps rectangle ink to proposal walls", () => {
    const result = extractWallsFromGray(makeRectGray(), SAMPLE_RECT_KITCHEN_MM, {
      minLengthPx: 20,
      minWalls: 3,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.walls.length).toBeGreaterThanOrEqual(3);
  });

  it("fails soft on empty image", () => {
    const empty: GrayBuffer = {
      width: 40,
      height: 40,
      data: new Uint8Array(1600).fill(250),
    };
    const result = extractWallsFromGray(empty, SAMPLE_RECT_KITCHEN_MM);
    expect(result.ok).toBe(false);
  });
});

describe("mergeCvWallsWithVision", () => {
  it("keeps Vision rooms and replaces walls", () => {
    const cvWalls = [
      { id: "cv-w1", a: { x: 0, y: 0 }, b: { x: 3600, y: 0 }, thicknessMm: 100 },
      { id: "cv-w2", a: { x: 3600, y: 0 }, b: { x: 3600, y: 3000 }, thicknessMm: 100 },
      { id: "cv-w3", a: { x: 3600, y: 3000 }, b: { x: 0, y: 3000 }, thicknessMm: 100 },
      { id: "cv-w4", a: { x: 0, y: 3000 }, b: { x: 0, y: 0 }, thicknessMm: 100 },
    ];
    const merged = mergeCvWallsWithVision(SAMPLE_RECT_KITCHEN_MM, cvWalls);
    expect(merged.rooms[0]?.name).toBe("Kitchen");
    expect(merged.walls.every((w) => w.id.startsWith("cv-"))).toBe(true);
    expect(merged.notes?.some((n) => n.includes("Phase 6B"))).toBe(true);
  });
});
