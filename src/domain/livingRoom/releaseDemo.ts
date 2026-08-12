import type { InteriorProject } from "../interiorProject";
import { moveLivingRoomObject, rotateLivingRoomObject } from "./planCommands";
import { createLivingRoomStarterProject } from "./preset";
import { applyLivingRoomStyle } from "./stylePresets";

export const LIVING_ROOM_RELEASE_DEMO_ID = "living-room-release-demo";
export const LIVING_ROOM_RELEASE_DEMO_DATE = "2026-08-12T12:00:00.000Z";

function objectId(project: InteriorProject, catalogItemId: string) {
  const object = project.objects.find((item) => item.catalogItemId === catalogItemId);
  if (!object) throw new Error(`Release demo is missing ${catalogItemId}.`);
  return object.id;
}

/** Stable showcase data used by onboarding and the release-candidate contract. */
export function createLivingRoomReleaseDemoProject(): InteriorProject {
  const starter = createLivingRoomStarterProject({
    projectId: LIVING_ROOM_RELEASE_DEMO_ID,
    projectName: "Living Room Release Demo",
    now: LIVING_ROOM_RELEASE_DEMO_DATE,
  });
  const styled = applyLivingRoomStyle(starter, "nordic-light");
  const chairId = objectId(styled, "living:lounge-chair");
  const sofaId = objectId(styled, "living:sofa-3-seat");
  const lampId = objectId(styled, "living:floor-lamp");
  const sideTableId = objectId(styled, "living:side-table");
  const arrangedChair = rotateLivingRoomObject(
    moveLivingRoomObject(styled, chairId, { x: -2050, y: 0, z: 150 }),
    chairId,
    30,
  );
  const arrangedSofa = rotateLivingRoomObject(arrangedChair, sofaId, 0);
  const arrangedLamp = moveLivingRoomObject(
    arrangedSofa,
    lampId,
    { x: 2450, y: 0, z: -1150 },
  );
  const arranged = moveLivingRoomObject(
    arrangedLamp,
    sideTableId,
    { x: -2100, y: 0, z: -1050 },
  );

  return {
    ...arranged,
    updatedAt: LIVING_ROOM_RELEASE_DEMO_DATE,
    renderSettings: {
      ...arranged.renderSettings,
      widthPx: 2560,
      heightPx: 1440,
      quality: "presentation",
      exposure: 1.18,
    },
    extensions: {
      ...arranged.extensions,
      releaseDemo: {
        id: LIVING_ROOM_RELEASE_DEMO_ID,
        version: 1,
      },
    },
  };
}
