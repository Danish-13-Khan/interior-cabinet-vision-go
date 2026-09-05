import { describe, expect, it } from "vitest";
import { SAMPLE_RECT_KITCHEN_MM } from "../sampleProposals";
import { buildArchShell } from "./buildArchShell";
import { cabinetWallSpans, mapFixturesToCatalog } from "./cabinetMapping";
import { resolveMaterial, lightingForPreset } from "./materials";
import { proposalToArchScene } from "./proposalToArchScene";
import { evaluateReconstructionGate } from "./reconstructionGate";
import { bindOpeningsToWalls, inferDoorSwing, resizeOpening } from "./bindOpenings";
import { buildPlacementConstraints } from "./placementConstraints";
import { traceRoomCycles } from "./roomCycles";
import { buildWallTopology } from "./wallTopology";

describe("Phases 8–14 architectural reconstruction", () => {
  it("Phase 8 binds kitchen openings to walls", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    expect(scene.openings.length).toBeGreaterThanOrEqual(1);
    expect(scene.openings.every((o) => scene.walls.some((w) => w.id === o.wallId))).toBe(true);
  });

  it("Phase 8 resize + swing helpers", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    const id = scene.openings[0]!.id;
    const resized = resizeOpening(scene.openings, id, 1200, 2100);
    expect(resized.find((o) => o.id === id)?.widthMm).toBe(1200);
    const door = { ...scene.openings[0]!, kind: "door" as const, t: 0.2, swing: "unknown" as const };
    expect(inferDoorSwing(door)).toBe("left");
  });

  it("Phase 9 builds floors and wall cycles", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    expect(scene.floors.length).toBeGreaterThanOrEqual(1);
    const cycles = traceRoomCycles(scene.walls, scene.wallJunctions);
    expect(cycles.length).toBeGreaterThanOrEqual(1);
  });

  it("Phase 10 fixtures have review state", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    expect(scene.fixtures.every((f) => f.review === "pending")).toBe(true);
  });

  it("Phase 11 arch shell includes skirting/frames/fixtures", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    const boxes = buildArchShell(scene);
    expect(boxes.some((b) => b.kind === "skirting")).toBe(true);
    expect(boxes.some((b) => b.kind === "opening")).toBe(true);
  });

  it("Phase 12 placement constraints", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    const c = buildPlacementConstraints(scene);
    expect(c.every((x) => x.usableMm <= x.lengthMm)).toBe(true);
    expect(mapFixturesToCatalog(scene).length).toBeGreaterThanOrEqual(0);
    expect(cabinetWallSpans(scene).length).toBe(scene.walls.length);
  });

  it("Phase 13 materials + lighting", () => {
    expect(resolveMaterial("door").color).toBe("#c9a227");
    expect(lightingForPreset("warm").color).toBe("#ffd9b0");
  });

  it("Phase 14 gate + heatmap", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    const gate = evaluateReconstructionGate(scene);
    expect(gate.pass).toBe(true);
    expect(gate.heatmap.length).toBeGreaterThan(0);
    expect(scene.materialHints.length).toBeGreaterThan(0);
    expect(scene.skirtingMm).toBe(100);
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
