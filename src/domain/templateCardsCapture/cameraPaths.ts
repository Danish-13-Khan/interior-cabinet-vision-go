import type { InteriorProject } from "../interiorProject";
import type { RoomSceneLookup } from "../livingRoom/roomSceneCache";
import type { CardCameraPathId } from "./types";
import { apartmentPathPose } from "./cameraPathsApartment";
import { roomArcPose } from "./cameraPathsRoomArc";
import type { CardCameraPose } from "./cameraPathPose";

export type CardCaptureView = {
  pose: CardCameraPose;
  overview: boolean;
  roomId: string | null;
  cameraId: string | null;
};

export function resolveCardCaptureView(
  project: InteriorProject,
  sceneFor: RoomSceneLookup,
  path: CardCameraPathId,
  t: number,
): CardCaptureView {
  if (path === "room-arc") {
    const arc = roomArcPose(project, sceneFor, t);
    return { pose: arc.pose, overview: false, roomId: arc.roomId, cameraId: arc.cameraId };
  }
  const apartment = apartmentPathPose(project, sceneFor, path, t);
  return {
    pose: apartment.pose,
    overview: apartment.overview,
    roomId: apartment.roomId,
    cameraId: apartment.cameraId,
  };
}
