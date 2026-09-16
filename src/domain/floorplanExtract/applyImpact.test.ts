import { describe, expect, it } from "vitest";
import {
  applyImpactKey,
  buildFloorplanApplySnapshot,
  shellTopologyFingerprint,
  summarizeFloorplanApplyImpact,
} from "./applyImpact";
import { createEmptyInteriorProject } from "../interiorProject/defaults";
import type { InteriorObjectEntity, InteriorProject } from "../interiorProject/types";

function shellProject(): InteriorProject {
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
  p.openings = [{
    id: "door-0",
    wallId: "wall-0",
    kind: "door",
    offsetMm: 500,
    widthMm: 900,
    heightMm: 2100,
    sillHeightMm: 0,
  }];
  p.rooms = [{
    id: "room-1",
    name: "Living",
    roomType: "living-room",
    dimensions: { widthMm: 4000, heightMm: 2700, depthMm: 4000 },
    wallThicknessMm: 150,
    outerLoopId: "room-1:outer-loop",
  }];
  p.loops = [{
    id: "room-1:outer-loop",
    wallUses: [{ wallId: "wall-0", direction: "forward" }],
  }];
  return p;
}

describe("summarizeFloorplanApplyImpact", () => {
  it("flags furniture and walls when no prior snapshot", () => {
    const p = createEmptyInteriorProject({ id: "p1" });
    p.walls = [{
      id: "wall-0", start: { x: 0, z: 0 }, end: { x: 4000, z: 0 },
      heightMm: 2700, thicknessMm: 150, visible: true, materialId: null,
    }];
    p.rooms = [{
      id: "room-1", name: "R", roomType: "custom",
      dimensions: { widthMm: 4000, heightMm: 2700, depthMm: 4000 }, wallThicknessMm: 150,
    }];
    p.objects = [{ id: "o1" } as InteriorObjectEntity];
    const f = summarizeFloorplanApplyImpact(p);
    expect(f.some((x) => x.code === "objects")).toBe(true);
    expect(f.some((x) => x.code === "walls")).toBe(true);
  });

  it("detects wall edits since snapshot when an ID is added", () => {
    const p = shellProject();
    p.extensions = { floorplanApplySnapshot: buildFloorplanApplySnapshot(p) };
    p.walls = [
      ...p.walls,
      {
        id: "wall-1", start: { x: 0, z: 0 }, end: { x: 0, z: 4000 },
        heightMm: 2700, thicknessMm: 150, visible: true, materialId: null,
      },
    ];
    const f = summarizeFloorplanApplyImpact(p);
    expect(f.some((x) => x.code === "shell_changed")).toBe(true);
  });

  it("detects geometry edits that keep the same IDs", () => {
    const p = shellProject();
    const beforeFp = shellTopologyFingerprint(p);
    p.extensions = { floorplanApplySnapshot: buildFloorplanApplySnapshot(p) };
    p.walls[0] = { ...p.walls[0], end: { x: 4500, z: 0 }, thicknessMm: 200 };
    p.nodes[1] = { id: "fp-node-1", position: { x: 4500, z: 0 } };
    p.openings[0] = { ...p.openings[0], offsetMm: 800, widthMm: 1000 };
    p.rooms[0] = { ...p.rooms[0], name: "Lounge", dimensions: { ...p.rooms[0].dimensions, widthMm: 4500 } };
    expect(shellTopologyFingerprint(p)).not.toBe(beforeFp);
    const f = summarizeFloorplanApplyImpact(p);
    expect(f.some((x) => x.code === "shell_geometry_changed")).toBe(true);
  });

  it("detects material-only wall edits and opening parameter/swing edits", () => {
    const p = shellProject();
    p.extensions = { floorplanApplySnapshot: buildFloorplanApplySnapshot(p) };
    p.walls[0] = { ...p.walls[0], materialId: "mat-paint-1", visible: false };
    p.openings[0] = {
      ...p.openings[0],
      swingDirection: "in",
      catalogItemId: "door.wood.panel",
      parameters: { handle: "left" },
      materialSlots: { leaf: "mat-wood" },
    };
    const f = summarizeFloorplanApplyImpact(p);
    expect(f.some((x) => x.code === "shell_geometry_changed")).toBe(true);
  });

  it("changes applyImpactKey on a second edit after the same finding code", () => {
    const p = shellProject();
    p.extensions = { floorplanApplySnapshot: buildFloorplanApplySnapshot(p) };
    p.walls[0] = { ...p.walls[0], end: { x: 4100, z: 0 } };
    const f1 = summarizeFloorplanApplyImpact(p);
    const k1 = applyImpactKey(p, f1);
    expect(f1.some((x) => x.code === "shell_geometry_changed")).toBe(true);

    p.walls[0] = { ...p.walls[0], end: { x: 4200, z: 0 } };
    const f2 = summarizeFloorplanApplyImpact(p);
    const k2 = applyImpactKey(p, f2);
    expect(f2.map((x) => x.code).sort().join("|")).toBe(f1.map((x) => x.code).sort().join("|"));
    expect(k2).not.toBe(k1);

    p.objects = [{ id: "o1" } as InteriorObjectEntity];
    const f3 = summarizeFloorplanApplyImpact(p);
    const k3 = applyImpactKey(p, f3);
    p.objects = [
      { id: "o1" } as InteriorObjectEntity,
      { id: "o2" } as InteriorObjectEntity,
    ];
    const f4 = summarizeFloorplanApplyImpact(p);
    const k4 = applyImpactKey(p, f4);
    expect(f3.some((x) => x.code === "objects")).toBe(true);
    expect(f4.some((x) => x.code === "objects")).toBe(true);
    expect(k4).not.toBe(k3);
  });
});
