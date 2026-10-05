import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import {
  APPLIANCE_DEPTH_MM,
  APPLIANCE_HOST_KEYS,
  APPLIANCE_WIDTH_MM,
  HOST_INSERT_KEYS,
  HOST_REMOVED,
  INSERT_HOSTED_BY,
  INSERT_KIND,
  OFFSET_ALONG_MM,
  OFFSET_DEPTH_MM,
  quarterTurn,
  readApplianceHost,
  ROTATION_OFFSET_DEG,
  withoutKeys,
  type ApplianceHost,
} from "./parameters";
import {
  clampApplianceOffsets,
  fallbackWorktopTopMm,
  hostedAppliancePose,
  offsetsFromPosition,
  worktopTopsByObjectId,
} from "./resolve";

const isHost = (object: InteriorObjectEntity | undefined): object is InteriorObjectEntity => object?.kind === "cabinet";

/** A drag, typed X/Z or R on the appliance itself (same host as before) becomes new offsets / turn. */
function editedMount(object: InteriorObjectEntity, previous: InteriorObjectEntity | undefined, host: InteriorObjectEntity, mount: ApplianceHost) {
  let next = mount;
  if (previous && readApplianceHost(previous)?.hostCabinetId === mount.hostCabinetId) {
    if (previous.position.x !== object.position.x || previous.position.z !== object.position.z) {
      next = { ...next, ...offsetsFromPosition(host, next, object.position) };
    }
    if (previous.rotation.y !== object.rotation.y) {
      next = { ...next, rotationOffsetDeg: quarterTurn(object.rotation.y - host.rotation.y) };
    }
  }
  return { ...next, ...clampApplianceOffsets(host, next, next) };
}

/**
 * Re-derives every hosted appliance from its host in the same commit, so moving, rotating or resizing
 * the host carries the appliance in one undo step. Pass the pre-edit project so edits to the appliance
 * itself are kept as offsets instead of snapping back. A deleted host detaches the appliance where it
 * was and flags `hostRemoved`. Host cabinets get `insertKind` + cut-out size on their own parameters
 * (the config is rebuilt from the object on every commit); stale host inserts are cleared.
 */
export function syncHostedAppliances(project: InteriorProject, previous?: InteriorProject): InteriorProject {
  const mounts = new Map<string, ApplianceHost>();
  for (const object of project.objects) {
    const mount = readApplianceHost(object);
    if (mount) mounts.set(object.id, mount);
  }
  const hostedCabinets = project.objects.some((object) => typeof object.parameters[INSERT_HOSTED_BY] === "string");
  if (mounts.size === 0 && !hostedCabinets) return project;

  const byId = new Map(project.objects.map((object) => [object.id, object]));
  const previousById = new Map(previous?.objects.map((object) => [object.id, object]));
  const tops = mounts.size > 0 ? worktopTopsByObjectId(project) : new Map<string, number>();
  const hostInsert = new Map<string, { applianceId: string; mount: ApplianceHost }>();

  const objects = project.objects.map((object) => {
    const stored = mounts.get(object.id);
    if (!stored) return object;
    const host = byId.get(stored.hostCabinetId);
    if (!isHost(host)) {
      return { ...object, parameters: { ...withoutKeys(object.parameters, APPLIANCE_HOST_KEYS), [HOST_REMOVED]: true } };
    }
    const mount = editedMount(object, previousById.get(object.id), host, stored);
    if (!hostInsert.has(host.id)) hostInsert.set(host.id, { applianceId: object.id, mount });
    const pose = hostedAppliancePose(host, mount, tops.get(host.id) ?? fallbackWorktopTopMm(host));
    return {
      ...object,
      position: pose.position,
      rotation: { ...object.rotation, y: pose.rotationY },
      parameters: {
        ...object.parameters,
        [OFFSET_ALONG_MM]: mount.offsetAlongMm,
        [OFFSET_DEPTH_MM]: mount.offsetDepthMm,
        [ROTATION_OFFSET_DEG]: mount.rotationOffsetDeg,
      },
    };
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
