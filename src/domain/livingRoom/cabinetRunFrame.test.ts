import { describe, expect, it } from "vitest";
import { createGoldenCabinetRunProject } from "./goldenRun/createProject";
import { compileLivingRoomScene } from "./sceneCompiler";
import { cabinetRunWallSides, resolveCabinetRunFrame, RUN_FRAME_FILL } from "./cabinetRunFrame";
import { projectAabbToScreen, screenBoundsFill, screenBoundsInsideFrame } from "./cameraScreenBounds";
import { isCabinetSceneNode, sceneNodeAabbMm } from "./sceneNodeBounds";

const scene = compileLivingRoomScene(createGoldenCabinetRunProject());
const viewports = [
  { widthPx: 1280, heightPx: 720 },
  { widthPx: 1000, heightPx: 700 },
  { widthPx: 820, heightPx: 760 },
];

describe("resolveCabinetRunFrame — Phase 4 exit gate", () => {
  const cabinets = scene.nodes.filter(isCabinetSceneNode);

  it("finds the golden run cabinets in the compiled scene", () => {
    expect(cabinets.length).toBeGreaterThanOrEqual(4);
  });

  for (const audience of ["author", "client"] as const) {
    for (const viewport of viewports) {
      it(`${audience} ${viewport.widthPx}×${viewport.heightPx}: every cabinet is in the first frame`, () => {
        const frame = resolveCabinetRunFrame(scene, viewport, { audience })!;
        expect(frame).not.toBeNull();
        const aspect = viewport.widthPx / viewport.heightPx;
        for (const node of cabinets) {
          const box = sceneNodeAabbMm(node)!;
          expect(screenBoundsInsideFrame(projectAabbToScreen(frame, aspect, box))).toBe(true);
        }
        const fill = screenBoundsFill(projectAabbToScreen(frame, aspect, frame.runBounds));
        expect(fill).toBeGreaterThan(RUN_FRAME_FILL - 0.08);
        expect(fill).toBeLessThan(RUN_FRAME_FILL + 0.08);
      });
    }
  }

  it("author view looks from the room interior side and is elevated", () => {
    const frame = resolveCabinetRunFrame(scene, viewports[0])!;
    expect(frame.position.y).toBeGreaterThan(frame.target.y);
    const runSides = cabinetRunWallSides(frame.runBounds, scene.bounds);
    expect(runSides.has("back")).toBe(true);
    expect(frame.position.z).toBeGreaterThan(frame.target.z);
  });

  it("never cuts away the walls the run stands against", () => {
    for (const audience of ["author", "client"] as const) {
      const frame = resolveCabinetRunFrame(scene, viewports[0], { audience })!;
      const runSides = cabinetRunWallSides(frame.runBounds, scene.bounds);
      for (const side of runSides) expect(frame.cutawaySides.has(side)).toBe(false);
      expect(frame.cutawaySides.size).toBeGreaterThan(0);
    }
  });

  it("client view hides every wall except the run walls", () => {
    const frame = resolveCabinetRunFrame(scene, viewports[0], { audience: "client" })!;
    const runSides = cabinetRunWallSides(frame.runBounds, scene.bounds);
    expect(frame.cutawaySides.size + runSides.size).toBe(4);
  });

  it("returns null when the room has no cabinets", () => {
    expect(resolveCabinetRunFrame({ nodes: [], bounds: scene.bounds }, viewports[0])).toBeNull();
  });
});
