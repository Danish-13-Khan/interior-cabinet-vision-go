import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance } from "../cabinetDimensions";
import { partPickForCutlistKey, partPickForMesh, retainedPartKey } from "./partPick";

function cabinet(id: string, objectId: string): CabinetInstance {
  return {
    id,
    name: "Base",
    interiorObjectId: objectId,
    placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
    config: getDefaultCabinetConfig("base"),
  };
}

describe("part pick", () => {
  const cabinets = [cabinet("cab-base", "obj-base")];

  it("resolves a cut-list row and a side-panel mesh to the same part", () => {
    const fromRow = partPickForCutlistKey(cabinets, "cab-base:left-side");
    const fromMesh = partPickForMesh(cabinets, "obj-base", "left-side-panel");
    expect(fromRow?.objectId).toBe("obj-base");
    expect(fromRow?.geometryNames).toContain("left-side-panel");
    expect(fromMesh?.cutlistKey).toBe("cab-base:left-side");
    expect(partPickForMesh(cabinets, "obj-base", "not-a-panel")).toBeNull();
  });

  it("clears the part when the object, room, or geometry no longer matches", () => {
    const keep = {
      cutlistKey: "cab-base:left-side",
      cabinets,
      activeRoomId: "room-a",
      selectedObjectIds: ["obj-base"],
      objectRoomId: () => "room-a",
    };
    expect(retainedPartKey(keep)).toBe("cab-base:left-side");
    expect(retainedPartKey({ ...keep, selectedObjectIds: ["other"] })).toBeNull();
    expect(retainedPartKey({ ...keep, selectedObjectIds: [] })).toBeNull();
    expect(retainedPartKey({ ...keep, activeRoomId: "room-b" })).toBeNull();
    expect(retainedPartKey({ ...keep, cutlistKey: "cab-base:missing" })).toBeNull();
  });
});
