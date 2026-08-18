import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import {
  estimateVendorPricing,
  getAdvancedStudioState,
  listLayoutSuggestions,
  recognizePlanUnderlay,
  setAdvancedStudioState,
} from "./advancedStudio";

describe("advanced studio", () => {
  const project = createLivingRoomStarterProject({ projectId: "advanced", now: "2026-08-18T00:00:00.000Z" });

  it("keeps a persistent floor stack and collaboration state", () => {
    const next = setAdvancedStudioState(project, {
      floors: [{ id: "floor-1", name: "Ground" }, { id: "floor-2", name: "Level 2" }],
      reviewNotes: [{ id: "note-1", text: "Check clearance", createdAt: "now" }],
      shareLabel: "Client link",
    });
    expect(getAdvancedStudioState(next).floors).toHaveLength(2);
    expect(getAdvancedStudioState(next).reviewNotes[0]?.text).toBe("Check clearance");
  });

  it("returns confirmable local plan recognition and actionable suggestions", () => {
    const room = project.rooms[0]!;
    const recognition = recognizePlanUnderlay({ fileName: "plan.png", dataUrl: "data:image/png;base64,AA", widthMm: 4000, heightMm: 3000, opacity: 0.42 }, room.dimensions);
    expect(recognition.confidence).toBeGreaterThan(0);
    expect(recognition.dimensions.depthMm).toBeGreaterThanOrEqual(2500);
    expect(listLayoutSuggestions(project)).toHaveLength(3);
    expect(estimateVendorPricing(project).every((item) => item.total > 0)).toBe(true);
  });
});
