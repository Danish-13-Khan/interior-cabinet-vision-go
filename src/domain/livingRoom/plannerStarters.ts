import {
  createWallSegment,
  deleteInteriorRoom,
  drawRoomFromPoints,
  renameInteriorRoom,
  synchronizeRoomSurfaceZones,
  validateInteriorProject,
  type InteriorProject,
} from "../interiorProject";

/** Project-home starter templates for the interiors planner. */
export type PlannerStarterTemplate =
  | "blank-room"
  | "wardrobe-wall"
  | "import-plan"
  | "l-room"
  | "2-room-flat";

/** Same L footprint used by D4 closed-loop fixtures (mm, pre-centering). */
export const L_ROOM_STARTER_POINTS = [
  { x: 0, z: 0 },
  { x: 4000, z: 0 },
  { x: 4000, z: 1500 },
  { x: 1500, z: 1500 },
  { x: 1500, z: 4000 },
  { x: 0, z: 4000 },
] as const;

function remappedOwnedContent(
  project: InteriorProject,
  fromRoomId: string,
  toRoomId: string,
): InteriorProject {
  return {
    ...project,
    cameras: project.cameras.map((camera) =>
      camera.roomId === fromRoomId ? { ...camera, roomId: toRoomId } : camera),
    lights: project.lights.map((light) =>
      light.roomId === fromRoomId ? { ...light, roomId: toRoomId } : light),
  };
}

function assertValid(project: InteriorProject): InteriorProject {
  const errors = validateInteriorProject(project).issues.filter((issue) => issue.severity === "error");
  if (errors.length) {
    throw new Error(`Invalid starter project: ${errors.map((issue) => issue.message).join("; ")}`);
  }
  return project;
}

function createLRoomStarter(project: InteriorProject): InteriorProject {
  const originalId = project.activeRoomId;
  const original = project.rooms.find((room) => room.id === originalId);
  const floorMaterialId = original?.extensions?.floorMaterialId;
  const ceilingMaterialId = original?.extensions?.ceilingMaterialId;
  const cleared = { ...project, objects: [] as InteriorProject["objects"] };
  const withL = drawRoomFromPoints(cleared, {
    kind: "polygon",
    points: [...L_ROOM_STARTER_POINTS],
  });
  const lRoomId = withL.activeRoomId;
  const remapped = remappedOwnedContent(withL, originalId, lRoomId);
  const finished = synchronizeRoomSurfaceZones({
    ...remapped,
    rooms: remapped.rooms.map((room) => {
      if (room.id !== lRoomId) return room;
      return {
        ...room,
        extensions: {
          ...room.extensions,
          ...(typeof floorMaterialId === "string" ? { floorMaterialId } : {}),
          ...(typeof ceilingMaterialId === "string" ? { ceilingMaterialId } : {}),
        },
      };
    }),
  });
  const solo = deleteInteriorRoom(finished, originalId);
  return assertValid(renameInteriorRoom(solo, lRoomId, "L Room"));
}

function createTwoRoomFlatStarter(project: InteriorProject): InteriorProject {
  const cleared = { ...project, objects: [] as InteriorProject["objects"] };
  const split = createWallSegment(cleared, {
    start: { x: 0, z: -2300 },
    end: { x: 0, z: 2300 },
    kind: "wall",
  });
  if (split.rooms.length < 2) {
    throw new Error("2-room-flat starter failed to split the room.");
  }
  const livingId = split.activeRoomId;
  const bedroomId = split.rooms.find((room) => room.id !== livingId)!.id;
  const named = renameInteriorRoom(
    renameInteriorRoom(split, livingId, "Living"),
    bedroomId,
    "Bedroom",
  );
  return assertValid(named);
}

/** Apply a project-home template onto a full living-room starter document. */
export function applyPlannerStarterTemplate(
  project: InteriorProject,
  template: PlannerStarterTemplate = "blank-room",
): InteriorProject {
  if (template === "blank-room" || template === "import-plan") {
    return { ...project, objects: [] };
  }
  if (template === "wardrobe-wall") {
    return {
      ...project,
      objects: project.objects.filter((object) => object.kind === "cabinet"),
    };
  }
  if (template === "l-room") return createLRoomStarter(project);
  if (template === "2-room-flat") return createTwoRoomFlatStarter(project);
  return project;
}
