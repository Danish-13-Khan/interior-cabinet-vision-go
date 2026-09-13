import type { InteriorProject, LightEntity } from "../interiorProject";
import { cabinetScenePosition } from "./cabinetSceneMount";

/** Resolve saved attachments at read time so moving/resizing a host is one undo step. */
export function resolveLightAttachment(project: InteriorProject, light: LightEntity): LightEntity {
  const hostId = light.parameters.hostObjectId;
  if (typeof hostId !== "string" || !hostId) return light;
  const host = project.objects.find((item) => item.id === hostId && item.roomId === light.roomId);
  if (!host) return { ...light, enabled: false, parameters: { ...light.parameters, attachmentMissing: true } };
  const origin = cabinetScenePosition(host);
  const angle = host.rotation.y * Math.PI / 180;
  const x = Number(light.parameters.offsetXmm ?? 0);
  const z = Number(light.parameters.offsetZmm ?? 0);
  return {
    ...light,
    position: { x: origin.x + x * Math.cos(angle) + z * Math.sin(angle),
      y: origin.y + Number(light.parameters.offsetYmm ?? -12),
      z: origin.z - x * Math.sin(angle) + z * Math.cos(angle) },
    rotation: { ...light.rotation, y: host.rotation.y },
    parameters: { ...light.parameters, attachmentMissing: false,
      widthMm: light.parameters.fitHostWidth === true ? Math.max(20, host.dimensions.widthMm - 40) : light.parameters.widthMm },
  };
}

export function attachLightToObject(project: InteriorProject, lightId: string, hostId: string): InteriorProject {
  const host = project.objects.find((object) => object.id === hostId && object.roomId === project.activeRoomId);
  if (!host) return project;
  return { ...project, lights: project.lights.map((light) => light.id !== lightId || light.roomId !== host.roomId ? light :
    resolveLightAttachment(project, { ...light, rotation: { x: -90, y: host.rotation.y, z: 0 },
      parameters: { ...light.parameters, hostObjectId: hostId, offsetXmm: 0, offsetYmm: -12,
        offsetZmm: host.dimensions.depthMm / 2 - 60, fitHostWidth: true } })) };
}

export function detachLight(project: InteriorProject, lightId: string): InteriorProject {
  return { ...project, lights: project.lights.map((light) => {
    if (light.id !== lightId || light.roomId !== project.activeRoomId) return light;
    const next = resolveLightAttachment(project, light);
    const parameters = { ...next.parameters };
    for (const key of ["hostObjectId", "offsetXmm", "offsetYmm", "offsetZmm", "fitHostWidth", "attachmentMissing"]) delete parameters[key];
    return { ...next, enabled: light.enabled, parameters };
  }) };
}
