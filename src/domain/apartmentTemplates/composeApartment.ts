import type { InteriorProject } from "../interiorProject";
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
 * Shell + per-room composers. Deterministic when `now` / id factory are fixed (D3).
 * Phase 6 may swap in createUniqueLivingRoomIdFactory for customer projects.
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
  return project;
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
