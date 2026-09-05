import { describe, expect, it } from "vitest";
import {
  drawRoomFromPoints,
  loadInteriorProjectFile,
  rectanglePoints,
  serializeInteriorProjectFile,
  validateInteriorProject,
  type InteriorProject,
} from "../interiorProject";
import {
  addLivingRoomObject,
  addLivingRoomOpening,
  applyPlannerStarterTemplate,
  arrangeCabinetRun,
  attachToWall,
  createLivingRoomObject,
  createLivingRoomStarterProject,
  createOpeningCatalogInstance,
  deleteLivingRoomOpening,
  deleteLivingRoomObjects,
} from ".";

/** Tiny undo stack mirroring editor history for domain regression. */
function withHistory(initial: InteriorProject) {
  const past: InteriorProject[] = [];
  let current = initial;
  return {
    get value() {
      return current;
    },
    commit(next: InteriorProject) {
      past.push(current);
      current = next;
      return current;
    },
    undo() {
      const previous = past.pop();
      if (!previous) return current;
      current = previous;
      return current;
    },
    pastLength() {
      return past.length;
    },
  };
}

function wallBySide(project: InteriorProject, side: string) {
  return project.walls.find((wall) => {
    const value = wall.extensions?.wallSide;
    return value === side;
  });
}

describe("2D-0.3 Golden Kitchen plan path (draw → openings → run → undo)", () => {
  it("keeps a coherent kitchen authoring path under fine-grained undo and file round-trip", () => {
    const blank = applyPlannerStarterTemplate(
      createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" }),
      "blank-room",
    );
    const history = withHistory(blank);

    // 1) Draw kitchen rectangle
    history.commit(drawRoomFromPoints(history.value, {
      kind: "rectangle",
      points: rectanglePoints({ x: 0, z: 0 }, { x: 4200, z: 3000 }),
    }));
    expect(history.value.rooms).toHaveLength(1);
    const roomId = history.value.activeRoomId;
    expect(roomId).toBeTruthy();
    expect(validateInteriorProject(history.value).issues.filter((i) => i.severity === "error")).toEqual([]);

    // 2) Openings (door + window) — separate commits for independent undo
    const front = wallBySide(history.value, "front") ?? history.value.walls[0]!;
    const left = wallBySide(history.value, "left")
      ?? history.value.walls.find((wall) => wall.id !== front.id)!;
    history.commit(addLivingRoomOpening(history.value, createOpeningCatalogInstance({
      id: "gk-door",
      roomId,
      wallId: front.id,
      catalogItemId: "opening:door-single",
      offsetMm: 400,
    })));
    history.commit(addLivingRoomOpening(history.value, createOpeningCatalogInstance({
      id: "gk-window",
      roomId,
      wallId: left.id,
      catalogItemId: "opening:window-fixed",
      offsetMm: 500,
    })));
    expect(history.value.openings.map((o) => o.id).sort()).toEqual(["gk-door", "gk-window"]);

    // 3) Cabinet run on the back wall — each cabinet committed, then arrange
    const back = wallBySide(history.value, "back")
      ?? history.value.walls.find((wall) => wall.id !== front.id && wall.id !== left.id)!;
    const cabinetIds = ["gk-base-a", "gk-drawer", "gk-base-b"] as const;
    const catalogIds = [
      "living:base-cabinet-900",
      "living:drawer-cabinet-900",
      "living:base-cabinet-900",
    ] as const;
    for (let index = 0; index < cabinetIds.length; index += 1) {
      const seed = createLivingRoomObject(catalogIds[index]!, {
        id: cabinetIds[index]!,
        roomId,
        position: { x: -900 + index * 700, y: 0, z: 0 },
      });
      const attached = attachToWall(history.value, seed, back.id);
      history.commit(addLivingRoomObject(history.value, attached));
    }
    history.commit(arrangeCabinetRun(history.value, [...cabinetIds], back.id, {
      alignment: "center",
      fillersEnabled: false,
    }));
    const runCabinets = history.value.objects.filter((object) => cabinetIds.includes(object.id as typeof cabinetIds[number]));
    expect(runCabinets).toHaveLength(3);
    expect(runCabinets.every((object) => object.extensions?.cabinetRun)).toBe(true);
    expect(validateInteriorProject(history.value).issues.filter((i) => i.severity === "error")).toEqual([]);

    // Save/reopen stand-in: serialize → reparse preserves run + openings
    const serialized = serializeInteriorProjectFile(history.value, "2026-09-05T12:00:00.000Z");
    const reloaded = loadInteriorProjectFile(serialized);
    expect(reloaded.document.openings.map((o) => o.id).sort()).toEqual(["gk-door", "gk-window"]);
    expect(
      reloaded.document.objects.filter((o) => cabinetIds.includes(o.id as typeof cabinetIds[number])),
    ).toHaveLength(3);
    expect(validateInteriorProject(reloaded.document).issues.filter((i) => i.severity === "error")).toEqual([]);

    // 4) Fine-grained undo: arrange → each cabinet → window → door → room shell
    const afterRun = history.value;
    history.undo(); // undo arrange (run membership) — cabinets remain
    expect(history.value.objects.filter((o) => cabinetIds.includes(o.id as typeof cabinetIds[number]))).toHaveLength(3);
    expect(
      history.value.objects
        .filter((o) => cabinetIds.includes(o.id as typeof cabinetIds[number]))
        .every((o) => !o.extensions?.cabinetRun),
    ).toBe(true);
    expect(history.value.openings).toHaveLength(2);

    history.undo(); // gk-base-b
    expect(history.value.objects.filter((o) => cabinetIds.includes(o.id as typeof cabinetIds[number]))).toHaveLength(2);
    history.undo(); // gk-drawer
    expect(history.value.objects.filter((o) => cabinetIds.includes(o.id as typeof cabinetIds[number]))).toHaveLength(1);
    history.undo(); // gk-base-a — run gone, openings intact
    expect(history.value.objects.filter((o) => cabinetIds.includes(o.id as typeof cabinetIds[number]))).toHaveLength(0);
    expect(history.value.openings).toHaveLength(2);

    history.undo(); // window — openings undo separately from run
    expect(history.value.openings.map((o) => o.id)).toEqual(["gk-door"]);
    history.undo(); // door
    expect(history.value.openings).toHaveLength(0);
    expect(history.value.rooms).toHaveLength(1);

    history.undo(); // drawn room
    expect(history.value.rooms.length).toBeLessThanOrEqual(1);
    expect(history.pastLength()).toBe(0);

    // Sanity: deleting opening / objects also stays valid on the forward path snapshot
    const cleaned = deleteLivingRoomObjects(
      deleteLivingRoomOpening(afterRun, "gk-window"),
      [...cabinetIds],
    );
    expect(cleaned.openings.some((o) => o.id === "gk-door")).toBe(true);
    expect(cleaned.objects.some((o) => cabinetIds.includes(o.id as typeof cabinetIds[number]))).toBe(false);
    expect(validateInteriorProject(cleaned).issues.filter((i) => i.severity === "error")).toEqual([]);
  });
});
