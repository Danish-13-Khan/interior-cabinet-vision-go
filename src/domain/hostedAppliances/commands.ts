import { supportsCountertop } from "../cabinetCapabilities";
import { readCabinetIdentity } from "../cabinetIdentity";
import type { InteriorObjectEntity, InteriorProject, ParameterValue } from "../interiorProject";
import {
  CUTOUT_DEPTH_MM,
  CUTOUT_WIDTH_MM,
  HOST_CABINET_ID,
  HOST_REMOVED,
  INSERT_KIND,
  OFFSET_ALONG_MM,
  OFFSET_DEPTH_MM,
  type HostedInsertKind,
} from "./parameters";
import { syncHostedAppliances } from "./sync";

type Patch = Record<string, ParameterValue>;

/** Worktop-height cabinets in the appliance's room (tall and wall units never carry a worktop). */
export function applianceHostCandidates(project: InteriorProject, appliance: InteriorObjectEntity): InteriorObjectEntity[] {
  return project.objects.filter((object) => {
    const type = object.roomId === appliance.roomId && object.kind === "cabinet" ? readCabinetIdentity(object)?.cabinetType : undefined;
    return type !== undefined && supportsCountertop(type);
  });
}

/** Centre the appliance on the cabinet; the cut-out starts at the appliance footprint, capped by the host. */
export function placeInCabinetPatch(appliance: InteriorObjectEntity, host: InteriorObjectEntity, insertKind: HostedInsertKind): Patch {
  return {
    [HOST_CABINET_ID]: host.id,
    [OFFSET_ALONG_MM]: 0,
    [OFFSET_DEPTH_MM]: 0,
    [CUTOUT_WIDTH_MM]: Math.round(Math.min(appliance.dimensions.widthMm, host.dimensions.widthMm)),
    [CUTOUT_DEPTH_MM]: Math.round(Math.min(appliance.dimensions.depthMm, host.dimensions.depthMm)),
    [INSERT_KIND]: insertKind,
    [HOST_REMOVED]: false,
  };
}

/** An empty host frees the appliance where it stands; the sync clears the host's insert. */
export const RELEASE_APPLIANCE_PATCH: Patch = { [HOST_CABINET_ID]: "", [HOST_REMOVED]: false };

function patchAndSync(project: InteriorProject, objectId: string, patch: Patch): InteriorProject {
  return syncHostedAppliances({
    ...project,
    objects: project.objects.map((object) => object.id === objectId ? { ...object, parameters: { ...object.parameters, ...patch } } : object),
  });
}

export function placeApplianceInCabinet(project: InteriorProject, applianceId: string, hostId: string, insertKind: HostedInsertKind) {
  const appliance = project.objects.find((object) => object.id === applianceId);
  const host = project.objects.find((object) => object.id === hostId && object.kind === "cabinet");
  return appliance && host ? patchAndSync(project, applianceId, placeInCabinetPatch(appliance, host, insertKind)) : project;
}

export function releaseAppliance(project: InteriorProject, applianceId: string): InteriorProject {
  return patchAndSync(project, applianceId, RELEASE_APPLIANCE_PATCH);
}
