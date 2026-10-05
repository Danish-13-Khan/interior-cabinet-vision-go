import type { InteriorProject } from "../interiorProject";
import { applyShowcaseCameras } from "./applyShowcaseCameras";
import { applyFinishRolesToAllRooms } from "./composers/applyFinishRoles";
import { buildApartmentShell, type BuildApartmentShellOptions } from "./buildApartmentShell";
import { apartmentIdFactory } from "./ids";
import type { ApartmentTemplateSpec, RoomComposition } from "./types";
import {
  composeBathroom,
  composeBedroom,
  composeFoyer,
  composeKitchen,
  composeLiving,
  composeStudy,
  composeUtility,
} from "./composers";

/**
 * Shell + per-room composers + showcase cameras. Deterministic when `now` /
 * id factory are fixed (D3). Phase 6 may swap in createUniqueLivingRoomIdFactory.
 */
export function composeApartment(
  spec: ApartmentTemplateSpec,
  options: BuildApartmentShellOptions = {},
): InteriorProject {
  const idFactory = options.idFactory ?? apartmentIdFactory(spec.id);
  let project = buildApartmentShell(spec, { ...options, idFactory });
  const keyToId = new Map(
    project.rooms.map((room) => [
      String(room.extensions?.apartmentRoomKey ?? ""),
      room.id,
    ]),
  );
  for (const room of spec.rooms) {
    const roomId = keyToId.get(room.key);
    if (!roomId) continue;
    project = runComposer(project, roomId, room.compose, idFactory);
  }
  // Finish roles reach every room (wardrobes, vanities, TV units, decor), not only kitchens.
  project = applyFinishRolesToAllRooms(project);
  const heroId = keyToId.get(spec.heroRoomKey);
  if (heroId && project.activeRoomId !== heroId) {
    project = { ...project, activeRoomId: heroId };
  }
  return applyShowcaseCameras(project, spec, keyToId, idFactory);
}

function runComposer(
  project: InteriorProject,
  roomId: string,
  compose: RoomComposition,
  idFactory: ReturnType<typeof apartmentIdFactory>,
): InteriorProject {
  switch (compose.kind) {
    case "kitchen":
      return composeKitchen(project, roomId, { ...compose.options, idFactory });
    case "bedroom":
      return composeBedroom(project, roomId, { ...compose.options, idFactory });
    case "living":
      return composeLiving(project, roomId, { ...compose.options, idFactory });
    case "bathroom":
      return composeBathroom(project, roomId, { ...compose.options, idFactory });
    case "foyer":
      return composeFoyer(project, roomId, { ...compose.options, idFactory });
    case "utility":
      return composeUtility(project, roomId, { ...compose.options, idFactory });
    case "study":
      return composeStudy(project, roomId, { ...compose.options, idFactory });
    case "none":
    default:
      return project;
  }
}
