import { describe, expect, it } from "vitest";
import { roomPlanViewBounds } from "../interiorProject";
import { proposalViewSelection } from "../livingRoom/proposal/proposalViewSelection";
import { AUTHORED_SHOWCASE_FOV } from "./applyShowcaseCameras";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { composeApartment } from "./composeApartment";
import { JOINERY_FRAME, frameJoineryCamera, joineryInsideFrame } from "./frameJoineryCamera";
import { ROOM_FRAME, frameRoomCamera } from "./frameRoomCamera";
import { cutListCabinets, joineryBoundsMm, joineryBoxesMm } from "./joineryBounds";
import { standingRect } from "./joineryStanding";
import { ONE_BHK_SHELL_SPEC } from "./specs/oneBhkShell";
import { STUDIO_SHELL_SPEC } from "./specs/studioShell";
import { THREE_BHK_SHELL_SPEC } from "./specs/threeBhkShell";
import { TWO_BHK_SHELL_SPEC } from "./specs/twoBhkShell";
import { roomIdByKey } from "./testSupport";

const TEMPLATES = [STUDIO_SHELL_SPEC, ONE_BHK_SHELL_SPEC, TWO_BHK_SHELL_SPEC, THREE_BHK_SHELL_SPEC];
const options = { now: COMPOSER_TEST_NOW };

/**
 * Rooms whose joinery cannot fit the widest field from inside the room:
 * narrow kitchens and utilities, and tall wardrobes in small bedrooms. The
 * far-corner frame is kept and flagged. A new entry is a regression to explain.
 */
const PARTIAL_VIEWS: Record<string, string[]> = {
  "template:apartment:studio:v1": ["entry"],
  "template:apartment:1bhk:v1": ["kitchen", "utility"],
  "template:apartment:2bhk:v1": ["kitchen"],
  "template:apartment:3bhk:v1": ["kitchen", "utility", "master"],
};

/** Rooms with under 500 mm of floor in front of the run: the tall unit in a 1.2 m utility. Never a default view. */
const TIGHT_VIEWS: Record<string, string[]> = {
  "template:apartment:studio:v1": [],
  "template:apartment:1bhk:v1": ["utility"],
  "template:apartment:2bhk:v1": [],
  "template:apartment:3bhk:v1": ["utility"],
};

describe("frameJoineryCamera (roadmap D2)", () => {
  it("keeps every cabinet inside 90 % of the frame from a standing eye inside the room, except the listed partial rooms", () => {
    for (const spec of TEMPLATES) {
      const project = composeApartment(spec, options);
      const ids = roomIdByKey(project);
      const partial: string[] = [];
      const tight: string[] = [];
      for (const room of spec.rooms) {
        const roomId = ids.get(room.key)!;
        const label = `${spec.id} ${room.key}`;
        const frame = frameJoineryCamera(project, roomId);
        if (!frame) {
          expect(cutListCabinets(project, roomId), label).toEqual([]);
          continue;
        }
        // Each room's own standing area: the 500 mm inset, shrunk to 150 mm only on a side the run crowds.
        const standing = standingRect(joineryBoundsMm(project, roomId)!, roomPlanViewBounds(project, roomId));
        expect(frame.position.y, label).toBe(JOINERY_FRAME.eyeHeightMm);
        expect(frame.position.x, label).toBeGreaterThanOrEqual(standing.minX - 1);
        expect(frame.position.x, label).toBeLessThanOrEqual(standing.maxX + 1);
        expect(frame.position.z, label).toBeGreaterThanOrEqual(standing.minZ - 1);
        expect(frame.position.z, label).toBeLessThanOrEqual(standing.maxZ + 1);
        expect(frame.fieldOfViewDegrees, label).toBeGreaterThanOrEqual(JOINERY_FRAME.fovDegrees);
        expect(frame.fieldOfViewDegrees, label).toBeLessThanOrEqual(JOINERY_FRAME.maxFovDegrees);
        if (frame.tight) {
          expect(frame.partial, label).toBe(true);
          tight.push(room.key);
        }
        if (frame.partial) {
          partial.push(room.key);
          continue;
        }
        expect(joineryInsideFrame(frame, joineryBoxesMm(project, roomId)), label).toBe(true);
      }
      expect(partial, spec.id).toEqual(PARTIAL_VIEWS[spec.id]);
      expect(tight, spec.id).toEqual(TIGHT_VIEWS[spec.id]);
    }
  });

  it("looks at the vanity wall in a bath and down the long axis of an empty room (D2b)", () => {
    const project = composeApartment(THREE_BHK_SHELL_SPEC, options);
    const ids = roomIdByKey(project);
    expect(frameRoomCamera(project, ids.get("guest-bath")!).side).toBe("east");
    expect(frameRoomCamera(project, ids.get("master-bath")!).side).toBe("north");
    const passage = frameRoomCamera(project, ids.get("passage")!);
    expect(passage.side).toBe("east");
    expect(passage.position.y).toBe(ROOM_FRAME.eyeHeightMm);
    expect(passage.target.y).toBe(ROOM_FRAME.targetHeightMm);
  });
});

describe("applyShowcaseCameras (roadmap D1, D2a)", () => {
  it("gives every room a bookmarked showcase camera and keeps only the hero's authored one", () => {
    for (const spec of TEMPLATES) {
      const project = composeApartment(spec, options);
      const ids = roomIdByKey(project);
      const bookmarked = new Set(project.renderSettings.packageCameraBookmarks.map((bookmark) => bookmark.cameraId));
      for (const room of spec.rooms) {
        const roomId = ids.get(room.key)!;
        const camera = project.cameras.find((item) => item.roomId === roomId && item.name.includes("Showcase"));
        expect(camera, `${spec.id} ${room.key}`).toBeTruthy();
        expect(bookmarked.has(camera!.id), `${spec.id} ${room.key}`).toBe(true);
        if (room.key === spec.heroRoomKey) {
          expect(room.camera, spec.id).toBeTruthy();
          expect(camera!.position).toEqual(room.camera!.eyeMm);
          expect(camera!.target).toEqual(room.camera!.targetMm);
          expect(camera!.fieldOfViewDegrees).toBe(AUTHORED_SHOWCASE_FOV);
          expect(camera!.isDefault).toBe(true);
        } else {
          expect(room.camera, `${spec.id} ${room.key}`).toBeUndefined();
          expect(camera!.isDefault).toBe(false);
        }
      }
    }
  });

  it("selects the hero plus joinery rooms by cabinet count for the 3 BHK, leaving tight rooms and the rest to tick", () => {
    const project = composeApartment(THREE_BHK_SHELL_SPEC, options);
    const selection = proposalViewSelection(project);
    const name = (cameraId: string) => project.cameras.find((camera) => camera.id === cameraId)!.name;
    expect(selection.explicit).toBe(true);
    expect(selection.selectedIds.map(name)).toEqual([
      "Living Showcase",
      "Kitchen Showcase",
      "Guest Showcase",
      "Foyer Showcase",
      "Study Showcase",
      "Kids Showcase",
      "Master Showcase",
    ]);
    expect(selection.availableIds).toHaveLength(THREE_BHK_SHELL_SPEC.rooms.length);
    const unselected = selection.availableIds.filter((id) => !selection.selectedIds.includes(id)).map(name);
    expect(unselected).toEqual([
      "Utility Showcase",
      "Balcony Showcase",
      "Passage Showcase",
      "Guest Bath Showcase",
      "Bath Showcase",
      "Master Bath Showcase",
      "Walk-in Showcase",
    ]);
  });
});
