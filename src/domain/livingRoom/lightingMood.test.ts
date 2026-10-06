import { describe, expect, it } from "vitest";
import { loadInteriorProjectFile, serializeInteriorProjectFile } from "../interiorProject";
import {
  environmentScaleForRoomLight,
  EVENING_ENVIRONMENT_SCALE,
  EVENING_ROOM_LIGHT_SCALE,
  lightingRecipeForMood,
  readLightingMood,
  roomLightScaleForMood,
  writeLightingMood,
} from "./lightingMood";
import { createLivingRoomStarterProject } from "./preset";

const NOW = "2026-10-05T00:00:00.000Z";

describe("lighting mood", () => {
  it("defaults to day and leaves the project untouched", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    expect(readLightingMood(project)).toBe("day");
    expect(writeLightingMood(project, "day")).toBe(project);
    expect(roomLightScaleForMood("day")).toBe(1);
    expect(environmentScaleForRoomLight(1)).toBe(1);
    expect(environmentScaleForRoomLight(EVENING_ROOM_LIGHT_SCALE)).toBe(EVENING_ENVIRONMENT_SCALE);
  });

  it("round-trips evening through save and reopen, and clears back to day", () => {
    const evening = writeLightingMood(createLivingRoomStarterProject({ now: NOW }), "evening");
    expect(roomLightScaleForMood(readLightingMood(evening))).toBe(EVENING_ROOM_LIGHT_SCALE);
    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(evening, NOW)).document;
    expect(readLightingMood(reopened)).toBe("evening");
    const day = writeLightingMood(reopened, "day");
    expect(readLightingMood(day)).toBe("day");
    expect(day.extensions && "lightingMood" in day.extensions).toBe(false);
  });

  it("lights day mood under an evening recipe with daylight, and leaves other recipes alone", () => {
    expect(lightingRecipeForMood("warm-evening", "day")).toBe("daylight");
    expect(lightingRecipeForMood("warm-evening", "evening")).toBe("warm-evening");
    expect(lightingRecipeForMood("neutral-studio", "day")).toBe("neutral-studio");
    expect(lightingRecipeForMood("daylight", "evening")).toBe("daylight");
  });
});
