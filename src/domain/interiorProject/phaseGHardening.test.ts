import { describe, expect, it } from "vitest";
import { DEFAULT_ROOM } from "../roomModel";
import { defaultCabinetProject } from "../cabinetDimensions";
import { interiorProjectFromCabinetProject } from "./cabinetAdapter";
import {
  assertInteriorProjectFileByteLimit,
  MAX_INTERIOR_PROJECT_FILE_BYTES,
} from "./fileFormatLimits";
import { MAX_PROJECT_ENTITIES_PER_COLLECTION, validateInteriorProject } from "./validation";

const NOW = "2026-08-11T16:12:01.000Z";

describe("Phase G hardening rails", () => {
  it("rejects payloads past the v1 project file byte limit", () => {
    expect(MAX_INTERIOR_PROJECT_FILE_BYTES).toBe(25 * 1024 * 1024);
    expect(() => assertInteriorProjectFileByteLimit(MAX_INTERIOR_PROJECT_FILE_BYTES)).not.toThrow();
    expect(() => assertInteriorProjectFileByteLimit(MAX_INTERIOR_PROJECT_FILE_BYTES + 1)).toThrow("25 MB");
  });

  it("truncates oversized collections for v1 performance safety", () => {
    const document = interiorProjectFromCabinetProject({
      project: defaultCabinetProject,
      activeRoom: DEFAULT_ROOM,
      now: NOW,
    }) as unknown as Record<string, unknown>;
    const roomId = String(document.activeRoomId);
    document.objects = Array.from({ length: MAX_PROJECT_ENTITIES_PER_COLLECTION + 2 }, (_, index) => ({
      id: `object-${index + 1}`,
      roomId,
      kind: "furniture",
      category: "custom",
      catalogItemId: "custom",
      name: `Object ${index + 1}`,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { widthMm: 600, heightMm: 600, depthMm: 600 },
      materialSlots: {},
      parameters: {},
    }));
    const result = validateInteriorProject(document);
    expect(result.project.objects).toHaveLength(MAX_PROJECT_ENTITIES_PER_COLLECTION);
    expect(result.issues.some((issue) => issue.code === "collection-truncated")).toBe(true);
  });
});
