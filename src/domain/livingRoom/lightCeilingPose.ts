import type { InteriorProject, LightEntity } from "../interiorProject";
import type { CeilingLightMount } from "./lightMountRead";

/** Ceiling lock: y follows room height; x/z and yaw stay authored. Emits down. */
export function resolveCeilingLightPose(
  project: InteriorProject,
  light: LightEntity,
  mount: CeilingLightMount,
): LightEntity | null {
  if (!light.roomId) return null;
  const room = project.rooms.find((item) => item.id === light.roomId);
  if (!room) return null;
  return {
    ...light,
    position: { ...light.position, y: room.dimensions.heightMm - mount.ceilingDropMm },
    rotation: { x: -90, y: light.rotation.y, z: 0 },
    parameters: {
      ...light.parameters,
      hostSurface: "ceiling",
      ceilingDropMm: mount.ceilingDropMm,
      attachmentMissing: false,
    },
  };
}
