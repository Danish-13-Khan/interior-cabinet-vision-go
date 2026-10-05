import type { InteriorProject, LightEntity } from "../interiorProject";
import { cabinetScenePosition } from "./cabinetSceneMount";
import { markLightAttachmentMissing } from "./lightMountParameters";
import { WALL_STRIP_END_MARGIN_MM } from "./lightWallPose";

export type ObjectLightMount = {
  kind: "object";
  hostObjectId: string;
  offsetXmm: number;
  offsetYmm: number;
  offsetZmm: number;
  fitHostWidth: boolean;
};

/** Cabinet host. Pose is cached; offsets in `parameters` stay the source of truth. */
export function resolveObjectLightPose(
  project: InteriorProject,
  light: LightEntity,
  mount: ObjectLightMount,
): LightEntity {
  const host = project.objects.find((item) => item.id === mount.hostObjectId && item.roomId === light.roomId);
  if (!host) return markLightAttachmentMissing(light);
  const origin = cabinetScenePosition(host);
  const angle = host.rotation.y * Math.PI / 180;
  const widthMm = mount.fitHostWidth
    ? Math.max(20, host.dimensions.widthMm - 2 * WALL_STRIP_END_MARGIN_MM)
    : light.parameters.widthMm;
  return {
    ...light,
    position: {
      x: origin.x + mount.offsetXmm * Math.cos(angle) + mount.offsetZmm * Math.sin(angle),
      y: origin.y + mount.offsetYmm,
      z: origin.z - mount.offsetXmm * Math.sin(angle) + mount.offsetZmm * Math.cos(angle),
    },
    rotation: { ...light.rotation, y: host.rotation.y },
    parameters: { ...light.parameters, attachmentMissing: false, widthMm },
  };
}
