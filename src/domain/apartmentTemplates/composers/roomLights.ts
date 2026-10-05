import { addRoomLightFixture, type RoomLightFixtureKind } from "../../livingRoom/roomLightFixtures";
import type { InteriorProject } from "../../interiorProject";
import { withActiveRoom } from "./helpers";

/** Add ceiling / room fixtures for the active room (idempotent per kind). */
export function addRoomFixtureKinds(
  project: InteriorProject,
  roomId: string,
  kinds: readonly RoomLightFixtureKind[],
): InteriorProject {
  let next = withActiveRoom(project, roomId);
  for (const kind of kinds) {
    const already = next.lights.some(
      (light) => light.roomId === roomId && light.parameters.fixtureKind === kind,
    );
    if (already) continue;
    next = addRoomLightFixture(next, kind, { kind: "ceiling" });
  }
  return next;
}
