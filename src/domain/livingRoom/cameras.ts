import type { CameraEntity } from "../interiorProject";
import { createRoomCameras, type CameraSeed } from "../interiorFoundation";
import type { LivingRoomIdFactory } from "./ids";

export const LIVING_ROOM_CAMERA_KEYS = [
  "wide-room",
  "seating-area",
  "tv-wall",
] as const;

const CAMERA_SEEDS: readonly CameraSeed[] = [
  {
    key: "wide-room", name: "Wide Room", position: { x: 1260, y: 1560, z: 3680 },
    target: { x: -280, y: 700, z: -180 }, fieldOfViewDegrees: 44, isDefault: true,
  },
  {
    key: "seating-area", name: "Seating Area", position: { x: 1070, y: 1520, z: 3180 },
    target: { x: -280, y: 680, z: -20 }, fieldOfViewDegrees: 40,
  },
  {
    key: "tv-wall", name: "TV Wall", position: { x: 0, y: 1540, z: 1930 },
    target: { x: 0, y: 1080, z: -1840 }, fieldOfViewDegrees: 44,
  },
];

/** Default living-room cameras — standing eye-level, furniture-first targets. */
export function createLivingRoomCameras(
  roomId: string,
  idFactory: LivingRoomIdFactory,
): CameraEntity[] {
  return createRoomCameras(roomId, CAMERA_SEEDS, idFactory);
}
