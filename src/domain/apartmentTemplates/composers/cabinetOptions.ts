import type { CabinetConfig } from "../../cabinetDimensions";
import {
  CABINET_PLANNING_EXTENSION,
  readPlanningExtension,
} from "../../cabinetIdentity";
import type { InteriorObjectEntity, InteriorProject } from "../../interiorProject";
import type { DoorSourcingOption, FinishRole, HandleHardwareId } from "../types";
import {
  DOOR_SOURCING_PARAMETER,
  DOOR_STYLE_PARAMETER,
  FRONT_SYSTEM_PARAMETER,
  defaultGolaProfiles,
  golaParametersPatch,
  pushParametersPatch,
  type PushMechanism,
} from "../../frontSystem";

export type CabinetFrontPatch = {
  frontSystem?: "handled" | "gola" | "push";
  pushMechanism?: PushMechanism;
  doorStyle?: "slab" | "shaker" | "glass";
  doorSourcing?: DoorSourcingOption;
  handleId?: HandleHardwareId;
};

export function applyCabinetFrontOptions(
  object: InteriorObjectEntity,
  options: CabinetFrontPatch,
): InteriorObjectEntity {
  const parameters = { ...object.parameters };
  if (options.frontSystem === "gola") {
    Object.assign(parameters, golaParametersPatch(defaultGolaProfiles()));
  } else if (options.frontSystem === "push") {
    Object.assign(parameters, pushParametersPatch(options.pushMechanism));
  } else if (options.frontSystem === "handled") {
    parameters[FRONT_SYSTEM_PARAMETER] = "handled";
  }
  if (options.doorStyle) parameters[DOOR_STYLE_PARAMETER] = options.doorStyle;
  if (options.doorSourcing) parameters[DOOR_SOURCING_PARAMETER] = options.doorSourcing;
  let next: InteriorObjectEntity = { ...object, parameters };
  if (options.handleId) next = patchHardwareHandle(next, options.handleId);
  return next;
}

function patchHardwareHandle(
  object: InteriorObjectEntity,
  handleId: HandleHardwareId,
): InteriorObjectEntity {
  const planning = readPlanningExtension(object.extensions);
  const config = planning?.config as CabinetConfig | undefined;
  if (!config?.hardware) return object;
  return {
    ...object,
    extensions: {
      ...object.extensions,
      [CABINET_PLANNING_EXTENSION]: {
        ...planning,
        config: {
          ...config,
          hardware: { ...config.hardware, handleId },
        },
      },
    },
  };
}

export function applyFinishRolesToCabinets(
  project: InteriorProject,
  roomId: string,
): InteriorProject {
  const roles = project.extensions?.finishRoles as Partial<Record<FinishRole, string>> | undefined;
  if (!roles) return project;
  return {
    ...project,
    objects: project.objects.map((object) => {
      if (object.roomId !== roomId || object.kind !== "cabinet") return object;
      const slots = { ...object.materialSlots };
      if (roles.carcass) slots.carcass = roles.carcass;
      if (roles["front-primary"]) slots.fronts = roles["front-primary"];
      if (roles.worktop) slots.countertop = roles.worktop;
      return { ...object, materialSlots: slots };
    }),
  };
}
