import { describe, expect, it } from "vitest";
import { roomPlanViewBounds } from "../../interiorProject";
import type { WallSide } from "../types";
import { bareRoom } from "./bareRoom";
import {
  composeBedroom,
  composeFoyer,
  composeLiving,
  composeStudy,
  composeUtility,
} from "./index";

const SIDES: WallSide[] = ["north", "south", "east", "west"];

function expectCentresInside(
  label: string,
  side: WallSide,
  project: ReturnType<typeof bareRoom>,
  match: (id: string) => boolean,
) {
  const bounds = roomPlanViewBounds(project, project.activeRoomId);
  const mounted = project.objects.filter((object) =>
    match(object.id)
    && (object.extensions?.wallAttachment as { wallId?: string } | undefined)?.wallId);
  expect(mounted.length, `${label} ${side}`).toBeGreaterThan(0);
  for (const object of mounted) {
    expect(object.position.x, `${label} ${side} x`).toBeGreaterThanOrEqual(bounds.minX);
    expect(object.position.x, `${label} ${side} x`).toBeLessThanOrEqual(bounds.maxX);
    expect(object.position.z, `${label} ${side} z`).toBeGreaterThanOrEqual(bounds.minZ);
    expect(object.position.z, `${label} ${side} z`).toBeLessThanOrEqual(bounds.maxZ);
  }
}

describe("wall-mounted composer placement", () => {
  it("keeps wardrobe, shoe, utility, living, and study centres inside on all sides", () => {
    for (const side of SIDES) {
      const bedroom = bareRoom("bedroom");
      expectCentresInside(
        "wardrobe",
        side,
        composeBedroom(bedroom, bedroom.activeRoomId, {
          wardrobeSide: side, wardrobeWidthMm: 900, pendants: false,
        }),
        (id) => id.includes("wardrobe"),
      );

      const foyerBare = bareRoom("custom", 4200, 3600);
      expectCentresInside(
        "shoe",
        side,
        composeFoyer(foyerBare, foyerBare.activeRoomId, { shoeCabinetSide: side }),
        (id) => id.includes("shoe"),
      );

      const utilBare = bareRoom("utility", 4200, 3600);
      expectCentresInside(
        "utility-tall",
        side,
        composeUtility(utilBare, utilBare.activeRoomId, { tallUnitSide: side }),
        (id) => id.includes("tall"),
      );

      const livingBare = bareRoom("living-room");
      expectCentresInside(
        "living-wall",
        side,
        composeLiving(livingBare, livingBare.activeRoomId, {
          tvWallSide: side, sofaSet: false, coveLight: false,
        }),
        (id) => /tv|niche|feature/.test(id),
      );

      const studyBare = bareRoom("office", 4200, 3600);
      expectCentresInside(
        "study",
        side,
        composeStudy(studyBare, studyBare.activeRoomId, {
          deskSide: side, openShelfSide: side,
        }),
        (id) => /desk|shelf/.test(id),
      );
    }
  });
});
