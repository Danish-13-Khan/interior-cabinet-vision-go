import type { CameraEntity, Point3Mm } from "../interiorProject";

export type CameraSeed = {
  key: string;
  name: string;
  position: Point3Mm;
  target: Point3Mm;
  fieldOfViewDegrees: number;
  isDefault?: boolean;
};

/** Converts room-relative camera presets into persisted project cameras. */
export function createRoomCameras(
  roomId: string,
  seeds: readonly CameraSeed[],
  idFactory: (scope: "camera", key: string) => string,
): CameraEntity[] {
  return seeds.map((seed, index) => ({
    id: idFactory("camera", seed.key),
    roomId,
    name: seed.name,
    position: { ...seed.position },
    target: { ...seed.target },
    fieldOfViewDegrees: seed.fieldOfViewDegrees,
    isDefault: seed.isDefault ?? index === 0,
  }));
}
