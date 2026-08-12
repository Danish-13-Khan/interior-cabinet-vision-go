import { describe, expect, it } from "vitest";
import {
  compileLivingRoomScene,
  createLivingRoomStarterProject,
} from "../../domain/livingRoom";
import { collectRenderDiagnostics } from "./collectRenderDiagnostics";

const NOW = "2026-08-12T20:05:00.000Z";

describe("collectRenderDiagnostics", () => {
  it("summarizes starter scene without crashing", () => {
    const scene = compileLivingRoomScene(createLivingRoomStarterProject({ now: NOW }));
    const report = collectRenderDiagnostics(scene, scene.cameras[0], NOW);
    expect(report.glbNodeCount + report.proceduralFallbackCount).toBeGreaterThan(0);
    expect(report.warnings.every((item) => item.message.length > 0)).toBe(true);
  });
});
