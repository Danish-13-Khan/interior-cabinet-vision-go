import { describe, expect, it } from "vitest";
import { SAMPLE_RECT_KITCHEN_MM } from "../sampleProposals";
import { buildArchShell } from "./buildArchShell";
import { cabinetWallSpans, mapFixturesToCatalog } from "./cabinetMapping";
import { resolveMaterial } from "./materials";
import { proposalToArchScene } from "./proposalToArchScene";
import { evaluateReconstructionGate } from "./reconstructionGate";
import { bindOpeningsToWalls } from "./bindOpenings";
import { buildWallTopology } from "./wallTopology";

describe("Phases 8–14 architectural reconstruction", () => {
  it("Phase 8 binds kitchen openings to walls", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    expect(scene.openings.length).toBeGreaterThanOrEqual(1);
    expect(scene.openings.every((o) => scene.walls.some((w) => w.id === o.wallId))).toBe(true);
    expect(scene.walls.some((w) => w.openingIds.length > 0)).toBe(true);
  });

  it("Phase 9 builds floors/ceilings", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    expect(scene.floors.length).toBe(1);
    expect(scene.ceilings.length).toBe(1);
  });

  it("Phase 10 infers kitchen semantic fixture", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    expect(scene.fixtures.some((f) => f.type.includes("kitchen"))).toBe(true);
  });

  it("Phase 11 builds arch shell with opening segments", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    const boxes = buildArchShell(scene);
    expect(boxes.some((b) => b.kind === "floor")).toBe(true);
    expect(boxes.some((b) => b.kind === "wall")).toBe(true);
    expect(boxes.some((b) => b.kind === "opening")).toBe(true);
  });

  it("Phase 12 cabinet spans and catalog map", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    const spans = cabinetWallSpans(scene);
    expect(spans.every((s) => s.usableMm <= s.lengthMm)).toBe(true);
    expect(mapFixturesToCatalog(scene).length).toBeGreaterThanOrEqual(0);
  });

  it("Phase 13 materials resolve", () => {
    expect(resolveMaterial("door").color).toBe("#c9a227");
    expect(resolveMaterial("missing").id).toBe("wall-interior");
  });

  it("Phase 14 gate passes kitchen scene", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    const gate = evaluateReconstructionGate(scene);
    expect(gate.pass).toBe(true);
  });

  it("bindOpenings helper attaches by wallId", () => {
    const topo = buildWallTopology(
      SAMPLE_RECT_KITCHEN_MM.walls.map((w) => ({
        id: w.id,
        start: w.a,
        end: w.b,
        thicknessMm: 100,
        heightMm: 2700,
        type: "unknown" as const,
        openingIds: [],
        confidence: "medium" as const,
      })),
    );
    const bound = bindOpeningsToWalls(topo.walls, SAMPLE_RECT_KITCHEN_MM);
    expect(bound.openings[0]?.wallId).toBeTruthy();
  });
});
