import { describe, expect, it } from "vitest";
import { compareSnapshot, describeSnapshotChanges, outlineProject } from "./snapshotSummary";

function project(overrides: Record<string, unknown> = {}) {
  return {
    id: "proj",
    name: "Kitchen",
    rooms: [{ id: "r1", name: "Kitchen" }],
    walls: [{ id: "w1" }, { id: "w2" }],
    openings: [{ id: "o1" }],
    objects: [
      { id: "c1", kind: "cabinet" },
      { id: "sofa", kind: "furniture", extensions: { assetImport: { sourceUrl: "idb:abc" } } },
    ],
    ...overrides,
  };
}

describe("snapshot summary", () => {
  it("counts rooms, walls, openings, cabinets, other objects and imported models", () => {
    expect(outlineProject(project())).toMatchObject({
      name: "Kitchen", rooms: 1, walls: 2, openings: 1, cabinets: 1, objects: 1, importedModels: 1,
    });
    expect(outlineProject(null)).toMatchObject({ name: "Untitled project", rooms: 0, cabinets: 0 });
  });

  it("describes what the version has compared with now", () => {
    const older = project({
      rooms: [{ id: "r1", name: "Old kitchen" }],
      objects: [{ id: "c1", kind: "cabinet" }, { id: "c2", kind: "cabinet" }, { id: "c3", kind: "cabinet" }],
    });
    const changes = describeSnapshotChanges(outlineProject(older), outlineProject(project()));
    expect(changes).toEqual(["+2 cabinets", "−1 object", "−1 imported model", "room renamed"]);
  });

  it("reports no changes for identical contents and none without a current project", () => {
    expect(compareSnapshot(project(), project()).changes).toEqual([]);
    const renamed = compareSnapshot(project({ name: "Draft" }), project());
    expect(renamed.changes).toEqual(["project named “Draft”"]);
    expect(compareSnapshot(project(), null)).toMatchObject({ current: null, changes: [] });
  });
});
