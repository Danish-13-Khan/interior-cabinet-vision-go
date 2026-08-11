import type { CameraEntity } from "../interiorProject";
import type { LivingRoomIdFactory } from "./ids";

export const LIVING_ROOM_CAMERA_KEYS = [
  "wide-room",
  "seating-area",
  "tv-wall",
] as const;

export function createLivingRoomCameras(
  roomId: string,
  idFactory: LivingRoomIdFactory,
): CameraEntity[] {
  return [
    {
      id: idFactory("camera", "wide-room"),
      roomId,
      name: "Wide Room",
      position: { x: 4300, y: 2200, z: 3900 },
      target: { x: 0, y: 900, z: 0 },
      fieldOfViewDegrees: 48,
      isDefault: true,
    },
    {
      id: idFactory("camera", "seating-area"),
      roomId,
      name: "Seating Area",
      position: { x: 3000, y: 1550, z: 2600 },
      target: { x: -250, y: 650, z: 250 },
      fieldOfViewDegrees: 42,
      isDefault: false,
    },
    {
      id: idFactory("camera", "tv-wall"),
      roomId,
      name: "TV Wall",
      position: { x: 0, y: 1500, z: 3300 },
      target: { x: 0, y: 900, z: -2050 },
      fieldOfViewDegrees: 38,
      isDefault: false,
    },
  ];
}
