import type { InteriorProject, LightEntity, ParameterValue } from "../interiorProject";
import { resolveCeilingLightPose } from "./lightCeilingPose";
import { readLightMount, type LightMount } from "./lightMountRead";
import { markLightAttachmentMissing, stripLightMountParameters } from "./lightMountParameters";
import { resolveObjectLightPose, type ObjectLightMount } from "./lightObjectPose";
import { resolveWallLightPose, type WallLightMount } from "./lightWallPose";
import { flushCeilingDropMm } from "./lightCutoutMount";

export type { LightMount } from "./lightMountRead";
export type { ObjectLightMount } from "./lightObjectPose";
export type { WallLightMount } from "./lightWallPose";
export type { CeilingLightMount } from "./lightMountRead";
export { readLightMount };

/** Resolve saved mounts at read time so moving a host is one undo step. */
export function resolveLightAttachment(project: InteriorProject, light: LightEntity): LightEntity {
  const mount = readLightMount(light);
  if (mount.kind === "free") return light;
  if (mount.kind === "object") return resolveObjectLightPose(project, light, mount);
  if (mount.kind === "wall") return resolveWallLightPose(project, light, mount) ?? markLightAttachmentMissing(light);
  return resolveCeilingLightPose(project, light, mount) ?? markLightAttachmentMissing(light);
}

function mapActiveLight(
  project: InteriorProject,
  lightId: string,
  update: (light: LightEntity) => LightEntity,
): InteriorProject {
  return {
    ...project,
    lights: project.lights.map((light) =>
      light.id === lightId && light.roomId === project.activeRoomId ? update(light) : light),
  };
}

function mounted(
  project: InteriorProject,
  light: LightEntity,
  parameters: Record<string, ParameterValue>,
): LightEntity {
  return resolveLightAttachment(project, {
    ...light,
    parameters: { ...stripLightMountParameters(light.parameters), ...parameters },
  });
}

function commitMount(
  project: InteriorProject,
  light: LightEntity,
  parameters: Record<string, ParameterValue>,
): LightEntity {
  const resolved = mounted(project, light, parameters);
  return resolved.parameters.attachmentMissing === true ? light : resolved;
}

export function attachLightToObject(project: InteriorProject, lightId: string, hostId: string): InteriorProject {
  const host = project.objects.find((object) => object.id === hostId && object.roomId === project.activeRoomId);
  if (!host) return project;
  return {
    ...project,
    lights: project.lights.map((light) => {
      if (light.id !== lightId || light.roomId !== host.roomId) return light;
      return commitMount(project, { ...light, rotation: { x: -90, y: host.rotation.y, z: 0 } }, {
        hostObjectId: hostId,
        offsetXmm: 0,
        offsetYmm: -12,
        offsetZmm: host.dimensions.depthMm / 2 - 60,
        fitHostWidth: true,
      });
    }),
  };
}

export function attachLightToWall(
  project: InteriorProject,
  lightId: string,
  mount: Omit<WallLightMount, "kind">,
): InteriorProject {
  return mapActiveLight(project, lightId, (light) => commitMount(project, light, {
    hostWallId: mount.hostWallId,
    alongMm: mount.alongMm,
    centerHeightMm: mount.centerHeightMm,
    wallSide: mount.wallSide,
    fitHostWidth: mount.fitHostWidth,
  }));
}

export function attachLightToCeiling(
  project: InteriorProject,
  lightId: string,
  ceilingDropMm: number,
  hostCutoutId?: string,
): InteriorProject {
  return mapActiveLight(project, lightId, (light) => commitMount(project, light, {
    hostSurface: "ceiling", ceilingDropMm, ...(hostCutoutId ? { hostCutoutId } : {}),
  }));
}

/** Centre a fixture in a ceiling cutout; the default drop leaves it flush with the slab underside. */
export function attachLightToCutout(
  project: InteriorProject,
  lightId: string,
  cutoutId: string,
  ceilingDropMm?: number,
): InteriorProject {
  const light = project.lights.find((item) => item.id === lightId);
  if (!light) return project;
  return attachLightToCeiling(project, lightId, ceilingDropMm ?? flushCeilingDropMm(light), cutoutId);
}

export function updateLightMount(project: InteriorProject, lightId: string, mount: LightMount): InteriorProject {
  if (mount.kind === "free") return detachLight(project, lightId);
  if (mount.kind === "wall") return attachLightToWall(project, lightId, mount);
  if (mount.kind === "ceiling") return attachLightToCeiling(project, lightId, mount.ceilingDropMm, mount.hostCutoutId);
  return writeObjectMount(project, lightId, mount);
}

function writeObjectMount(project: InteriorProject, lightId: string, mount: ObjectLightMount): InteriorProject {
  return mapActiveLight(project, lightId, (light) => commitMount(project, light, {
    hostObjectId: mount.hostObjectId,
    offsetXmm: mount.offsetXmm,
    offsetYmm: mount.offsetYmm,
    offsetZmm: mount.offsetZmm,
    fitHostWidth: mount.fitHostWidth,
  }));
}

/** Bake the resolved pose and drop every mount key, including a missing host. */
export function detachLight(project: InteriorProject, lightId: string): InteriorProject {
  return mapActiveLight(project, lightId, (light) => {
    const resolved = resolveLightAttachment(project, light);
    return {
      ...resolved,
      enabled: light.enabled,
      parameters: stripLightMountParameters(resolved.parameters),
    };
  });
}
