import { addRoomLightFixture, type RoomLightFixtureKind } from "../../livingRoom/roomLightFixtures";
import { getLightFixtureDefinition } from "../../livingRoom/lightFixtureRegistry";
import type { InteriorProject } from "../../interiorProject";
import { longestFreePieceOnSide, withActiveRoom } from "./helpers";
import type { WallSide } from "../types";

/** Add fixtures for the active room (idempotent per kind). Uses a valid mount. */
export function addRoomFixtureKinds(
  project: InteriorProject,
  roomId: string,
  kinds: readonly RoomLightFixtureKind[],
  wallSide: WallSide = "north",
): InteriorProject {
  let next = withActiveRoom(project, roomId);
  for (const kind of kinds) {
    const already = next.lights.some(
      (light) => light.roomId === roomId && light.parameters.fixtureKind === kind,
    );
    if (already) continue;
    const definition = getLightFixtureDefinition(kind);
    if (definition.mounts.includes("ceiling")) {
      next = addRoomLightFixture(next, kind, { kind: "ceiling" });
      continue;
    }
    if (definition.mounts.includes("wall")) {
      const wall = longestFreePieceOnSide(next, roomId, wallSide, 400)?.wall;
      if (wall) {
        next = addRoomLightFixture(next, kind, { kind: "wall", wallId: wall.id });
        continue;
      }
    }
    if (definition.mounts.includes("free")) {
      next = addRoomLightFixture(next, kind);
    }
  }
  return next;
}
