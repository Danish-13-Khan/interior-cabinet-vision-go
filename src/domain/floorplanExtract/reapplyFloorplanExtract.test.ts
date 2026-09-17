import { describe, expect, it } from "vitest";
import { reapplyFloorplanExtract } from "./reapplyFloorplanExtract";
import {
  buildFloorplanApplySnapshot,
  isFloorplanShellStaleSinceApply,
  shellTopologyFingerprint,
} from "./applyImpact";
import { createEmptyInteriorProject } from "../interiorProject/defaults";
import type { ExtractionResult } from "./types";

function rect(id: string, x0: number, y0: number, x1: number, y1: number) {
  return { id, outer: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as [number, number][] };
}

const closedBoxExtract: ExtractionResult = {
  schema_version: "1.0",
  units: "meters",
  polygons: {
    rooms: [rect("room-0", 0.2, 0.2, 4, 4)],
    walls: [
      rect("wall-0", 0, 0, 4.2, 0.2),
      rect("wall-1", 4, 0, 4.2, 4.2),
      rect("wall-2", 0, 4, 4.2, 4.2),
      rect("wall-3", 0, 0, 0.2, 4.2),
    ],
    doors: [],
    windows: [],
  },
};

describe("reapplyFloorplanExtract", () => {
  it("writes shell + hashed snapshot from saved extract", () => {
    const empty = createEmptyInteriorProject({ id: "p1" });
    const next = reapplyFloorplanExtract(empty, closedBoxExtract);
    expect(next.walls.length).toBeGreaterThan(0);
    const snap = next.extensions?.floorplanApplySnapshot as { shellFingerprint?: string };
    expect(snap.shellFingerprint).toMatch(/^[0-9a-f]{14}$/);
    expect(snap.shellFingerprint).toBe(shellTopologyFingerprint(next));
    expect(isFloorplanShellStaleSinceApply(next)).toBe(false);
  });

  it("clears stale after re-apply over an edited shell", () => {
    let project = reapplyFloorplanExtract(createEmptyInteriorProject({ id: "p1" }), closedBoxExtract);
    const snap = buildFloorplanApplySnapshot(project);
    project = {
      ...project,
      walls: project.walls.map((w, i) =>
        i === 0 ? { ...w, thicknessMm: w.thicknessMm + 25 } : w,
      ),
      extensions: {
        ...project.extensions,
        floorplanApplySnapshot: snap,
        floorplanExtractDraft: closedBoxExtract,
      },
    };
    expect(isFloorplanShellStaleSinceApply(project)).toBe(true);
    project = reapplyFloorplanExtract(project, closedBoxExtract);
    expect(isFloorplanShellStaleSinceApply(project)).toBe(false);
  });
});
