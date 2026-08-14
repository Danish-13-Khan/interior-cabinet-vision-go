import type { CameraEntity } from "../interiorProject";
import type { LivingRoomIdFactory } from "./ids";

export const LIVING_ROOM_CAMERA_KEYS = [
  "wide-room",
  "seating-area",
  "tv-wall",
] as const;

/** Default living-room cameras — standing eye-level, furniture-first targets. */
export function createLivingRoomCameras(
  roomId: string,
  idFactory: LivingRoomIdFactory,
): CameraEntity[] {
  return [
    {
      id: idFactory("camera", "wide-room"),
      roomId,
      name: "Wide Room",
      position: { x: 1260, y: 1560, z: 3680 },
      target: { x: -280, y: 700, z: -180 },
      fieldOfViewDegrees: 44,
      isDefault: true,
    },
    {
      id: idFactory("camera", "seating-area"),
      roomId,
      name: "Seating Area",
      position: { x: 1070, y: 1520, z: 3180 },
      target: { x: -280, y: 680, z: -20 },
      fieldOfViewDegrees: 40,
      isDefault: false,
    },
    {
      id: idFactory("camera", "tv-wall"),
      roomId,
      name: "TV Wall",
      position: { x: 0, y: 1500, z: 1980 },
      target: { x: 0, y: 920, z: -2050 },
      fieldOfViewDegrees: 42,
      isDefault: false,
    },
  ];
}
