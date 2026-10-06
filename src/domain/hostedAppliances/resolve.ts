import {
  COUNTERTOP_HOST_MAX_HEIGHT_MM,
  createCabinetPlanningWorkflow,
  DEFAULT_COUNTERTOP_THICKNESS_MM,
} from "../cabinetRuns";
import { cabinetProjectFromInteriorProject, type InteriorObjectEntity, type InteriorProject } from "../interiorProject";
import type { ApplianceHost } from "./parameters";

/** Worktop top surface (mm above floor) per host object id, from each room's centred run. */
export function worktopTopsByObjectId(project: InteriorProject): Map<string, number> {
  const adapted = cabinetProjectFromInteriorProject(project);
  const rooms = adapted.project.rooms?.length
    ? adapted.project.rooms
    : [{ cabinets: adapted.project.cabinets, config: { dimensions: adapted.room.dimensions } }];
  const tops = new Map<string, number>();
  for (const room of rooms) {
    const { widthMm, depthMm, heightMm } = room.config.dimensions;
    const workflow = createCabinetPlanningWorkflow(
      { ...adapted.project, cabinets: room.cabinets },
      { widthMm, depthMm, heightMm },
    );
    const objectIdOf = new Map(room.cabinets.map((cabinet) => [cabinet.id, cabinet.interiorObjectId ?? cabinet.id]));
    const lowHost = (cabinetId: string) => {
      const objectId = objectIdOf.get(cabinetId) ?? cabinetId;
      const host = project.objects.find((object) => object.id === objectId);
      return (host?.dimensions.heightMm ?? 0) <= COUNTERTOP_HOST_MAX_HEIGHT_MM;
    };
    for (const segment of workflow.countertops) {
      if (!segment.cabinetIds.every(lowHost)) continue;
      for (const cabinetId of segment.cabinetIds) {
        tops.set(objectIdOf.get(cabinetId) ?? cabinetId, segment.positionY + segment.thicknessMm);
      }
    }
  }
  return tops;
}

/** No countertop segment (e.g. a lone cabinet): assume a standard worktop on the carcass. */
export function fallbackWorktopTopMm(host: InteriorObjectEntity): number {
  return host.position.y + host.dimensions.heightMm + DEFAULT_COUNTERTOP_THICKNESS_MM;
}

/**
 * Appliance pose from its host: offsets are in the host's frame (along its width, into its depth),
 * the model sits on the worktop top, and rotation follows the host's 90° steps.
 */
export function hostedAppliancePose(host: InteriorObjectEntity, mount: ApplianceHost, worktopTopMm: number) {
  const angle = (host.rotation.y * Math.PI) / 180;
  const { offsetAlongMm: along, offsetDepthMm: depth } = mount;
  return {
    position: {
      x: Math.round((host.position.x + along * Math.cos(angle) + depth * Math.sin(angle)) * 10) / 10,
      y: Math.round(worktopTopMm * 10) / 10,
      z: Math.round((host.position.z - along * Math.sin(angle) + depth * Math.cos(angle)) * 10) / 10,
    },
    rotationY: (host.rotation.y + mount.rotationOffsetDeg) % 360,
  };
}

type Offsets = Pick<ApplianceHost, "offsetAlongMm" | "offsetDepthMm">;

/** Keeps the cut-out inside the host's footprint (centred when it is as wide / deep as the host). */
export function clampApplianceOffsets(host: InteriorObjectEntity, mount: ApplianceHost, offsets: Offsets): Offsets {
  const limit = (value: number, room: number) => Math.round(Math.min(Math.max(value, -room), room));
  return {
    offsetAlongMm: limit(offsets.offsetAlongMm, Math.max(0, (host.dimensions.widthMm - mount.cutoutWidthMm) / 2)),
    offsetDepthMm: limit(offsets.offsetDepthMm, Math.max(0, (host.dimensions.depthMm - mount.cutoutDepthMm) / 2)),
  };
}

/** Inverse of `hostedAppliancePose`: a dragged or typed plan position as offsets in the host's frame. */
export function offsetsFromPosition(host: InteriorObjectEntity, mount: ApplianceHost, position: { x: number; z: number }): Offsets {
  const angle = (host.rotation.y * Math.PI) / 180;
  const dx = position.x - host.position.x;
  const dz = position.z - host.position.z;
  return clampApplianceOffsets(host, mount, {
    offsetAlongMm: dx * Math.cos(angle) - dz * Math.sin(angle),
    offsetDepthMm: dx * Math.sin(angle) + dz * Math.cos(angle),
  });
}
