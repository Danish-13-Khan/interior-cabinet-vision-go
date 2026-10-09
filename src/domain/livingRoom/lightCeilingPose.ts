import type { InteriorProject, LightEntity } from "../interiorProject";
import { ceilingCutoutSizeMm } from "../interiorProject";
import { hostableCeilingCutout } from "./lightCutoutMount";
import type { CeilingLightMount } from "./lightMountRead";

/**
 * Ceiling lock: y follows room height; x/z and yaw stay authored, unless the
 * mount names a cutout, in which case x/z follow the cutout's centre. A cutout
 * that no longer exists, or that the room has shrunk away from, leaves the
 * light at its stored position as a plain ceiling mount.
 */
export function resolveCeilingLightPose(
  project: InteriorProject,
  light: LightEntity,
  mount: CeilingLightMount,
): LightEntity | null {
  if (!light.roomId) return null;
  const room = project.rooms.find((item) => item.id === light.roomId);
  if (!room) return null;
  const cutout = mount.hostCutoutId ? hostableCeilingCutout(project, room.id, mount.hostCutoutId) : undefined;
  const centre = cutout ? ceilingCutoutSizeMm(cutout) : null;
  const { hostCutoutId: _stale, ...parameters } = light.parameters;
  return {
    ...light,
    position: {
      x: centre?.centerX ?? light.position.x,
      y: room.dimensions.heightMm - mount.ceilingDropMm,
      z: centre?.centerZ ?? light.position.z,
    },
    rotation: { x: -90, y: light.rotation.y, z: 0 },
    parameters: {
      ...parameters,
      hostSurface: "ceiling",
      ceilingDropMm: mount.ceilingDropMm,
      ...(cutout ? { hostCutoutId: cutout.id } : {}),
      attachmentMissing: false,
    },
  };
}
