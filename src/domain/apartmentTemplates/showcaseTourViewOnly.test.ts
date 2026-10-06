import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { instantiateApartmentTemplate } from "./instantiateApartmentTemplate";
import { readLightingMood, roomLightScaleForMood, viewLightingMood } from "../livingRoom/lightingMood";
import { deepFreeze } from "./showcaseTourTestSupport";

/** Same fingerprint useDraftAutosave compares before it schedules a save. */
const autosaveFingerprint = (project: unknown) => JSON.stringify({ project, room: null });

/** Files that make up the tour; none may reach a document, undo or autosave write path. */
const TOUR_SOURCES = [
  "src/domain/apartmentTemplates/showcaseTour.ts",
  "src/domain/apartmentTemplates/showcaseTourController.ts",
  "src/domain/apartmentTemplates/showcaseTourInput.ts",
  "src/domain/apartmentTemplates/showcaseTourSession.ts",
  "src/domain/apartmentTemplates/showcaseTourView.ts",
  "src/hooks/useShowcaseTour.ts",
  "src/components/livingRoomScene/ShowcaseTourControls.tsx",
];
const WRITE_PATHS = [
  "onPatchDocument", "commitDocument", "commitSnapshot", "setActiveLivingRoom",
  "showcaseCameraPatch", "writeLightingMood", "renderSettings:", "localStorage",
];

describe("Showcase tour is view-only", () => {
  it("tour code has no path to document, undo, saved-camera or storage writes", () => {
    for (const file of TOUR_SOURCES) {
      const source = readFileSync(file, "utf8");
      for (const write of WRITE_PATHS) expect(source.includes(write), `${file} uses ${write}`).toBe(false);
    }
  });

  it("the Day/Evening tour toggle changes the light on screen, not the project or its autosave fingerprint", () => {
    const project = deepFreeze(instantiateApartmentTemplate("template:apartment:3bhk:v1", { now: COMPOSER_TEST_NOW }));
    const fingerprint = autosaveFingerprint(project);
    const saved = readLightingMood(project);
    const other = saved === "day" ? "evening" : "day";
    expect(viewLightingMood(project, null)).toBe(saved);
    expect(viewLightingMood(project, other)).toBe(other);
    expect(roomLightScaleForMood(viewLightingMood(project, "evening")))
      .toBeLessThan(roomLightScaleForMood(viewLightingMood(project, "day")));
    expect(readLightingMood(project)).toBe(saved);
    expect(autosaveFingerprint(project)).toBe(fingerprint);
  });
});
