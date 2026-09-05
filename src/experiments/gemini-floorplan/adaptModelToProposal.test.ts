import { describe, expect, it } from "vitest";
import { adaptModelOutputToProposal } from "./adaptModelToProposal";
import type { FloorplanModelOutput } from "./floorplanModelTypes";
import { modelFixtureStem } from "./modelCvHybrid";
import { SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";

const rectModel: FloorplanModelOutput = {
  source: "fixture",
  imageWidthPx: 640,
  imageHeightPx: 480,
  polygons: [
    { class: "wall", pointsPx: [{ x: 80, y: 80 }, { x: 560, y: 80 }] },
    { class: "wall", pointsPx: [{ x: 560, y: 80 }, { x: 560, y: 400 }] },
    { class: "wall", pointsPx: [{ x: 560, y: 400 }, { x: 80, y: 400 }] },
    { class: "wall", pointsPx: [{ x: 80, y: 400 }, { x: 80, y: 80 }] },
    { class: "door", pointsPx: [{ x: 200, y: 80 }, { x: 280, y: 80 }] },
  ],
};

describe("adaptModelOutputToProposal", () => {
  it("maps wall polylines into proposal mm and keeps Vision room name", () => {
    const adapted = adaptModelOutputToProposal(rectModel, SAMPLE_RECT_KITCHEN_MM);
    expect(adapted.rooms[0]?.name).toBe("Kitchen");
    expect(adapted.walls.length).toBeGreaterThanOrEqual(4);
    expect(adapted.walls.every((w) => w.id.startsWith("model-"))).toBe(true);
    expect(adapted.notes?.some((n) => n.includes("Phase 6C"))).toBe(true);
    const top = adapted.walls.find((w) => Math.abs(w.a.y - w.b.y) < 1);
    expect(top).toBeTruthy();
  });

  it("keeps Vision openings when present", () => {
    const adapted = adaptModelOutputToProposal(rectModel, SAMPLE_RECT_KITCHEN_MM);
    expect(adapted.openings?.some((o) => o.id === "door-1")).toBe(true);
  });
});

describe("modelFixtureStem", () => {
  it("strips extension and vision suffix", () => {
    expect(modelFixtureStem("rect-kitchen.png")).toBe("rect-kitchen");
    expect(modelFixtureStem("rect-kitchen-vision.jpg")).toBe("rect-kitchen");
    expect(modelFixtureStem(null)).toBe("rect-kitchen");
  });
});
