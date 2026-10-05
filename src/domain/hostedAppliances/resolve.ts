import { createCabinetPlanningWorkflow, DEFAULT_COUNTERTOP_THICKNESS_MM } from "../cabinetRuns";
import { cabinetProjectFromInteriorProject, type InteriorObjectEntity, type InteriorProject } from "../interiorProject";
import type { ApplianceHost } from "./parameters";

/** Worktop top surface (mm above floor) per host object id, from the run's countertop segment. */
export function worktopTopsByObjectId(project: InteriorProject): Map<string, number> {
  const adapted = cabinetProjectFromInteriorProject(project);
  const { widthMm, depthMm, heightMm } = adapted.room.dimensions;
  const workflow = createCabinetPlanningWorkflow(adapted.project, { widthMm, depthMm, heightMm });
  const objectIdOf = new Map(adapted.project.cabinets.map((cabinet) => [cabinet.id, cabinet.interiorObjectId ?? cabinet.id]));
  const tops = new Map<string, number>();
  for (const segment of workflow.countertops) {
    for (const cabinetId of segment.cabinetIds) {
      tops.set(objectIdOf.get(cabinetId) ?? cabinetId, segment.positionY + segment.thicknessMm);
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
    rotationY: host.rotation.y,
  };
}
