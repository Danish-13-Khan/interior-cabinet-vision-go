import type { InteriorProject } from "../../interiorProject";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { StudyComposeOptions, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import { placeCatalogOnWall, withActiveRoom } from "./helpers";

export type ComposeStudyArgs = StudyComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/**
 * Study desk + open shelf — reuses console-table and open-shelf catalog items.
 */
export function composeStudy(
  project: InteriorProject,
  roomId: string,
  options: ComposeStudyArgs = {},
): InteriorProject {
  const idFactory = options.idFactory ?? apartmentIdFactory("template:apartment:compose");
  const deskSide: WallSide = options.deskSide ?? "north";
  const shelfSide: WallSide = options.openShelfSide ?? deskSide;
  let next = withActiveRoom(project, roomId);
  next = placeCatalogOnWall(
    next, roomId, deskSide, "living:console-table", `${roomId}-desk`, idFactory, 0.4,
  );
  next = placeCatalogOnWall(
    next, roomId, shelfSide, "living:open-shelf-900", `${roomId}-shelf`, idFactory, 0.75,
  );
  return {
    ...next,
    objects: next.objects.map((object) => {
      if (object.id === idFactory("object", `${roomId}-desk`)) {
        return {
          ...object,
          name: "Study desk",
          parameters: { ...object.parameters, apartmentRole: "study-desk" },
        };
      }
      return object;
    }),
  };
}
