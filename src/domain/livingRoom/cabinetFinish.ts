import {
  persistCabinetIdentityOnObject,
  readPlanningExtension,
  CABINET_PLANNING_EXTENSION,
} from "../cabinetIdentity";
import type { CabinetConfig } from "../cabinetDimensions";
import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";

export function cabinetFinishId(object: InteriorObjectEntity) {
  const planning = readPlanningExtension(object.extensions);
  const config = planning?.config as CabinetConfig | undefined;
  const fromRules = config?.buildRules?.finishId;
  if (typeof fromRules === "string" && fromRules) return fromRules;
  return typeof object.parameters.finishId === "string" ? object.parameters.finishId : "wood-oak";
}

/** Persist finish on planning buildRules so Engineering keeps it. */
export function persistCabinetFinishOnObject(
  object: InteriorObjectEntity,
  finishId: string,
): InteriorObjectEntity {
  const planning = readPlanningExtension(object.extensions);
  const config = planning?.config as CabinetConfig | undefined;
  return persistCabinetIdentityOnObject({
    ...object,
    parameters: { ...object.parameters, finishId },
    extensions: {
      ...object.extensions,
      [CABINET_PLANNING_EXTENSION]: {
        ...planning,
        config: config
          ? {
              ...config,
              buildRules: { ...config.buildRules, finishId },
            }
          : config,
      },
    },
  });
}

export function setLivingRoomObjectParameters(
  project: InteriorProject,
  objectId: string,
  patch: Record<string, string | number | boolean>,
): InteriorProject {
  return {
    ...project,
    objects: project.objects.map((object) => {
      if (object.id !== objectId) return object;
      const next = { ...object, parameters: { ...object.parameters, ...patch } };
      return typeof patch.finishId === "string"
        ? persistCabinetFinishOnObject(next, patch.finishId)
        : next;
    }),
  };
}
