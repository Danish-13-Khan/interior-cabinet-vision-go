import { describe, expect, it } from "vitest";
import { loadInteriorProjectFile, serializeInteriorProjectFile } from "../interiorProject";
import { EVENING_ROOM_LIGHT_SCALE, readLightingMood, roomLightScaleForMood, writeLightingMood } from "./lightingMood";
import { createLivingRoomStarterProject } from "./preset";

const NOW = "2026-10-05T00:00:00.000Z";

describe("lighting mood", () => {
  it("defaults to day and leaves the project untouched", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    expect(readLightingMood(project)).toBe("day");
    expect(writeLightingMood(project, "day")).toBe(project);
    expect(roomLightScaleForMood("day")).toBe(1);
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
});
