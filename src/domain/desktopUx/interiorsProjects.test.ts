import { describe, expect, it } from "vitest";
import { createEmptyInteriorProject } from "../interiorProject";
import { createDefaultJobMeta } from "../jobMeta";
import { writeProposalCommercial } from "../livingRoom/proposal/commercialState";
import type { SavedProjectBrowserEntry } from "../projectBrowserStorage";
import {
  interiorsProjectKindLabel,
  interiorsProjectStatusTone,
  interiorsRecentProjectCard,
  interiorsRelativeTime,
} from "./interiorsProjects";
import type { InteriorProject } from "../interiorProject";

function kitchen(patch: Partial<InteriorProject> = {}): InteriorProject {
  const base = createEmptyInteriorProject({ id: "proj-1", name: "Khan Residence" });
  return {
    ...base,
    activeRoomId: "room-1",
    rooms: [{
      id: "room-1",
      name: "Kitchen",
      roomType: "kitchen",
      dimensions: { widthMm: 4000, heightMm: 2700, depthMm: 3500 },
      wallThicknessMm: 100,
    }],
    ...patch,
  };
}

function entry(document: InteriorProject | undefined): SavedProjectBrowserEntry {
  return {
    id: "saved-1",
    name: "Khan Residence",
    thumbnail: "",
    updatedAt: "2026-09-02T11:42:00.000Z",
    project: { version: 1, cabinets: [], interiorDocument: document },
    room: { widthMm: 4000, depthMm: 3500, heightMm: 2700 },
  } as SavedProjectBrowserEntry;
}

describe("interiorsProjects", () => {
  it("uses commercial job status labels on recent cards", () => {
    expect(interiorsProjectStatusTone("draft", false)).toBe("room");
    expect(interiorsProjectStatusTone("draft", true)).toBe("design");
    expect(interiorsProjectStatusTone("quoted", true)).toBe("quoted");
    expect(interiorsProjectStatusTone("approved", true)).toBe("approved");
    expect(interiorsProjectStatusTone("production", true)).toBe("sent");
  });

  it("names the room or cabinet run without QA copy", () => {
    expect(interiorsProjectKindLabel(kitchen())).toBe("Kitchen");
    expect(interiorsProjectKindLabel(kitchen({
      objects: [{ kind: "cabinet" } as InteriorProject["objects"][number]],
    }))).toBe("Kitchen run");
  });

  it("formats relative edit time", () => {
    const now = Date.parse("2026-09-02T12:00:00.000Z");
    expect(interiorsRelativeTime("2026-09-02T11:42:00.000Z", now)).toBe("Edited 18 min ago");
    expect(interiorsRelativeTime("2026-09-01T12:00:00.000Z", now)).toBe("Edited yesterday");
  });

  it("maps Interiors jobs and skips cabinet-only recents", () => {
    const now = Date.parse("2026-09-02T12:00:00.000Z");
    const quoted = writeProposalCommercial(kitchen({
      objects: [{ kind: "cabinet" } as InteriorProject["objects"][number]],
    }), { job: createDefaultJobMeta({ status: "quoted", revision: "B" }) });
    const card = interiorsRecentProjectCard(entry(quoted), now);
    expect(card?.statusLabel).toBe("Quote Frozen");
    expect(card?.revision).toBe("B");
    expect(card?.kindLabel).toBe("Kitchen run");
    expect(interiorsRecentProjectCard(entry(undefined), now)).toBeNull();
  });
});
