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
      position: { x: 1260, y: 1550, z: 3680 },
      target: { x: -310, y: 620, z: -240 },
      fieldOfViewDegrees: 45,
      isDefault: true,
    },
    {
      id: idFactory("camera", "seating-area"),
      roomId,
      name: "Seating Area",
      position: { x: 1070, y: 1420, z: 3200 },
      target: { x: -310, y: 600, z: -40 },
      fieldOfViewDegrees: 41,
      isDefault: false,
    },
    {
      id: idFactory("camera", "tv-wall"),
      roomId,
      name: "TV Wall",
      position: { x: 0, y: 1450, z: 1980 },
      target: { x: 0, y: 900, z: -2050 },
      fieldOfViewDegrees: 44,
      isDefault: false,
    },
  ];
}
