import type { InteriorObjectEntity, InteriorProject } from "../../interiorProject";
import type { FinishRole } from "../types";
import {
  DOOR_STYLE_PARAMETER,
  FRONT_SYSTEM_PARAMETER,
  defaultGolaProfiles,
  golaParametersPatch,
} from "../../frontSystem";

export function applyCabinetFrontOptions(
  object: InteriorObjectEntity,
  options: { frontSystem?: "handled" | "gola"; doorStyle?: "slab" | "shaker" | "glass" },
): InteriorObjectEntity {
  const parameters = { ...object.parameters };
  if (options.frontSystem === "gola") {
    Object.assign(parameters, golaParametersPatch(defaultGolaProfiles()));
  } else if (options.frontSystem === "handled") {
    parameters[FRONT_SYSTEM_PARAMETER] = "handled";
  }
  if (options.doorStyle) parameters[DOOR_STYLE_PARAMETER] = options.doorStyle;
  return { ...object, parameters };
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
