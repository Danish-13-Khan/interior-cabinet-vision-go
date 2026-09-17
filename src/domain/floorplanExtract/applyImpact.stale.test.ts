import { describe, expect, it } from "vitest";
import {
  buildFloorplanApplySnapshot,
  floorplanShellStaleSinceApply,
  isFloorplanShellStaleSinceApply,
  shellTopologyFingerprint,
} from "./applyImpact";
import { createEmptyInteriorProject } from "../interiorProject/defaults";
import type { InteriorObjectEntity } from "../interiorProject/types";

function shellProject() {
  const p = createEmptyInteriorProject({ id: "p1" });
  p.nodes = [
    { id: "fp-node-0", position: { x: 0, z: 0 } },
    { id: "fp-node-1", position: { x: 4000, z: 0 } },
  ];
  p.walls = [{
    id: "wall-0",
    start: { x: 0, z: 0 },
    end: { x: 4000, z: 0 },
    heightMm: 2700,
    thicknessMm: 150,
    visible: true,
    materialId: null,
    startNodeId: "fp-node-0",
    endNodeId: "fp-node-1",
  }];
  return p;
}

describe("isFloorplanShellStaleSinceApply", () => {
  it("is false right after snapshot, true after shell edit", () => {
    const p = shellProject();
    p.extensions = { floorplanApplySnapshot: buildFloorplanApplySnapshot(p) };
    expect(isFloorplanShellStaleSinceApply(p)).toBe(false);
    expect(shellTopologyFingerprint(p)).toMatch(/^[0-9a-f]{14}$/);

    p.walls = [{ ...p.walls[0], thicknessMm: 200 }];
    expect(isFloorplanShellStaleSinceApply(p)).toBe(true);
    expect(floorplanShellStaleSinceApply(p)).toEqual({ stale: true, reason: "diverged" });
  });

  it("treats ID-only snapshot as stale/unknown", () => {
    const p = shellProject();
    p.extensions = {
      floorplanApplySnapshot: {
        wallIds: ["wall-0"],
        openingIds: [],
        roomIds: [],
        objectCount: 0,
      },
    };
    expect(floorplanShellStaleSinceApply(p)).toEqual({
      stale: true,
      reason: "legacy_snapshot",
    });
  });

  it("is false when no snapshot", () => {
    const p = createEmptyInteriorProject({ id: "p2" });
    expect(isFloorplanShellStaleSinceApply(p)).toBe(false);
  });

  it("moving a cabinet does not stale", () => {
    const p = shellProject();
    p.extensions = { floorplanApplySnapshot: buildFloorplanApplySnapshot(p) };
    p.objects = [{
      id: "cab-1",
      catalogId: "base-cabinet",
      position: { x: 100, y: 0, z: 200 },
      rotationY: 0,
    } as InteriorObjectEntity];
    expect(isFloorplanShellStaleSinceApply(p)).toBe(false);

    p.objects = [{
      ...p.objects[0],
      position: { x: 900, y: 0, z: 400 },
    }];
    expect(isFloorplanShellStaleSinceApply(p)).toBe(false);
  });
});
