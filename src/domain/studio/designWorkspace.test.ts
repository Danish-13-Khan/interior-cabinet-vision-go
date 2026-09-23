import { describe, expect, it } from "vitest";
import { createEmptyInteriorProject } from "../interiorProject";
import type { InteriorObjectEntity, OpeningEntity, WallEntity } from "../interiorProject";
import { designViewToolIds, switchDesignView } from "./designContext";
import { designFooterStatus, nextSnapSizeMm } from "./designFooter";
import { buildDesignHierarchy, filterDesignHierarchy } from "./designHierarchy";

function wall(id: string, roomId: string): WallEntity {
  return {
    id, roomId, start: { x: 0, z: 0 }, end: { x: 2400, z: 0 },
    heightMm: 2700, thicknessMm: 100, visible: true, materialId: null,
  };
}

function opening(id: string, wallId: string, kind: OpeningEntity["kind"]): OpeningEntity {
  return { id, wallId, kind, offsetMm: 100, widthMm: 800, heightMm: 2100, sillHeightMm: 0 };
}

function object(id: string, roomId: string, kind: InteriorObjectEntity["kind"], name: string): InteriorObjectEntity {
  return {
    id, roomId, kind, category: kind, catalogItemId: id, name,
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    dimensions: { widthMm: 600, heightMm: 720, depthMm: 560 },
    materialSlots: {}, parameters: {},
  };
}

function project() {
  const base = createEmptyInteriorProject({ id: "p1", name: "Kitchen", now: "2026-09-23T12:00:00.000Z" });
  return {
    ...base,
    activeRoomId: "room-a",
    rooms: [
      { id: "room-a", name: "Kitchen", roomType: "kitchen" as const, dimensions: { widthMm: 4000, heightMm: 2700, depthMm: 3000 }, wallThicknessMm: 100 },
      { id: "room-b", name: "Hall", roomType: "custom" as const, dimensions: { widthMm: 2000, heightMm: 2700, depthMm: 2000 }, wallThicknessMm: 100 },
    ],
    walls: [wall("w1", "room-a")],
    openings: [opening("d1", "w1", "door"), opening("win1", "w1", "window")],
    objects: [
      object("cab-1", "room-a", "cabinet", "Base 600"),
      object("sofa-1", "room-a", "furniture", "Sofa"),
    ],
  };
}

describe("design workspace", () => {
  it("keeps room, selection, and revision when switching 2D and 3D", () => {
    const context = { view: "plan" as const, roomId: "room-a", selectedIds: ["cab-1"], revision: "B" };
    const model = switchDesignView(context, "model");
    const plan = switchDesignView(model, "plan");
    expect(model.view).toBe("model");
    expect(plan.view).toBe("plan");
    expect(model.roomId).toBe("room-a");
    expect(model.selectedIds).toEqual(["cab-1"]);
    expect(model.revision).toBe("B");
    expect(plan.selectedIds).toEqual(context.selectedIds);
  });

  it("uses different tools for plan and model", () => {
    expect(designViewToolIds("plan")).toContain("snap");
    expect(designViewToolIds("plan")).not.toContain("fit-selection");
    expect(designViewToolIds("model")).toContain("fit-selection");
    expect(designViewToolIds("model")).not.toContain("snap");
  });

  it("lists the active room with walls, openings, manufactured cabinets, and bought-in furniture", () => {
    const nodes = buildDesignHierarchy(project());
    expect(nodes.map((node) => node.kind)).toEqual(["room", "wall", "door", "window", "cabinet", "furniture", "room"]);
    expect(nodes.find((node) => node.kind === "cabinet")?.detail).toBe("Manufactured cabinetry");
    expect(nodes.find((node) => node.kind === "furniture")?.detail).toBe("Bought-in");
    expect(nodes.find((node) => node.id === "room:room-b")?.depth).toBe(0);
    expect(nodes.filter((node) => node.roomId === "room-b")).toHaveLength(1);
  });

  it("filters hierarchy rows and keeps the matching room", () => {
    const nodes = buildDesignHierarchy(project());
    const filtered = filterDesignHierarchy(nodes, "sofa");
    expect(filtered.map((node) => node.id)).toEqual(["room:room-a", "object:sofa-1"]);
  });

  it("reports millimetres, snap, selection, and warnings", () => {
    const status = designFooterStatus({
      snapSizeMm: 50,
      gridOn: true,
      viewLabel: "2D plan",
      selectedCount: 1,
      issues: [{ severity: "warning" }, { severity: "error" }],
    });
    expect(status).toEqual({
      units: "mm",
      snap: "50 mm",
      zoom: "2D plan",
      selection: "1 selected",
      warnings: "1 warning, 1 error",
    });
    expect(nextSnapSizeMm(50)).toBe(100);
    expect(nextSnapSizeMm(100)).toBe(10);
  });
});
