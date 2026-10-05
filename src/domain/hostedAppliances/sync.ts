import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import {
  APPLIANCE_DEPTH_MM,
  APPLIANCE_HOST_KEYS,
  APPLIANCE_WIDTH_MM,
  HOST_INSERT_KEYS,
  HOST_REMOVED,
  INSERT_HOSTED_BY,
  INSERT_KIND,
  readApplianceHost,
  withoutKeys,
  type ApplianceHost,
} from "./parameters";
import { fallbackWorktopTopMm, hostedAppliancePose, worktopTopsByObjectId } from "./resolve";

const isHost = (object: InteriorObjectEntity | undefined): object is InteriorObjectEntity => object?.kind === "cabinet";

/**
 * Re-derives every hosted appliance from its host in the same commit, so moving, rotating or resizing
 * the host carries the appliance in one undo step. A deleted host detaches the appliance where it was
 * and flags `hostRemoved`. Host cabinets get `insertKind` + cut-out size on their own parameters
 * (the config is rebuilt from the object on every commit); stale host inserts are cleared.
 */
export function syncHostedAppliances(project: InteriorProject): InteriorProject {
  const mounts = new Map<string, ApplianceHost>();
  for (const object of project.objects) {
    const mount = readApplianceHost(object);
    if (mount) mounts.set(object.id, mount);
  }
  const hostedCabinets = project.objects.some((object) => typeof object.parameters[INSERT_HOSTED_BY] === "string");
  if (mounts.size === 0 && !hostedCabinets) return project;

  const byId = new Map(project.objects.map((object) => [object.id, object]));
  const tops = mounts.size > 0 ? worktopTopsByObjectId(project) : new Map<string, number>();
  const hostInsert = new Map<string, { applianceId: string; mount: ApplianceHost }>();

  const objects = project.objects.map((object) => {
    const mount = mounts.get(object.id);
    if (!mount) return object;
    const host = byId.get(mount.hostCabinetId);
    if (!isHost(host)) {
      return { ...object, parameters: { ...withoutKeys(object.parameters, APPLIANCE_HOST_KEYS), [HOST_REMOVED]: true } };
    }
    if (!hostInsert.has(host.id)) hostInsert.set(host.id, { applianceId: object.id, mount });
    const pose = hostedAppliancePose(host, mount, tops.get(host.id) ?? fallbackWorktopTopMm(host));
    return { ...object, position: pose.position, rotation: { ...object.rotation, y: pose.rotationY } };
  });

  return {
    ...project,
    objects: objects.map((object) => {
      if (object.kind !== "cabinet") return object;
      const insert = hostInsert.get(object.id);
      if (!insert) {
        return typeof object.parameters[INSERT_HOSTED_BY] === "string"
          ? { ...object, parameters: withoutKeys(object.parameters, HOST_INSERT_KEYS) }
          : object;
      }
      return {
        ...object,
        parameters: {
          ...object.parameters,
          [INSERT_KIND]: insert.mount.insertKind,
          [INSERT_HOSTED_BY]: insert.applianceId,
          [APPLIANCE_WIDTH_MM]: Math.round(insert.mount.cutoutWidthMm),
          [APPLIANCE_DEPTH_MM]: Math.round(insert.mount.cutoutDepthMm),
        },
      };
    }),
  };
}
