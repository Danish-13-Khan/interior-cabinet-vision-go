import { validateInteriorProject, type InteriorProject } from "../interiorProject";
import type { BuildApartmentShellOptions } from "./buildApartmentShell";
import { composeApartment } from "./composeApartment";
import { ONE_BHK_SHELL_SPEC } from "./specs/oneBhkShell";
import { STUDIO_SHELL_SPEC } from "./specs/studioShell";
import { THREE_BHK_SHELL_SPEC } from "./specs/threeBhkShell";
import { TWO_BHK_SHELL_SPEC } from "./specs/twoBhkShell";
import type { ApartmentTemplateId, ApartmentTemplateSpec } from "./types";

const BY_ID: Partial<Record<ApartmentTemplateId, ApartmentTemplateSpec>> = {
  "template:apartment:studio:v1": STUDIO_SHELL_SPEC,
  "template:apartment:1bhk:v1": ONE_BHK_SHELL_SPEC,
  "template:apartment:2bhk:v1": TWO_BHK_SHELL_SPEC,
  "template:apartment:3bhk:v1": THREE_BHK_SHELL_SPEC,
};

/** Product apartment template ids (Studio / 1–3 BHK). */
export const APARTMENT_TEMPLATE_IDS = [
  "template:apartment:studio:v1",
  "template:apartment:1bhk:v1",
  "template:apartment:2bhk:v1",
  "template:apartment:3bhk:v1",
] as const satisfies readonly ApartmentTemplateId[];

export function lookupApartmentTemplate(
  id: string,
): ApartmentTemplateSpec | undefined {
  return BY_ID[id as ApartmentTemplateId];
}

/**
 * Dev / product entry: compose the authored apartment and require a clean validate.
 * Deterministic when `now` / id factory are fixed (D3).
 */
export function instantiateApartmentTemplate(
  id: ApartmentTemplateId | string,
  options: BuildApartmentShellOptions = {},
): InteriorProject {
  const spec = lookupApartmentTemplate(id);
  if (!spec) throw new Error(`Unknown apartment template ${id}`);
  const project = composeApartment(spec, options);
  const result = validateInteriorProject(project);
  const repairs = result.issues.filter((issue) => issue.repaired);
  if (repairs.length) {
    throw new Error(
      `Apartment template required repairs: ${repairs.map((i) => i.code).join(", ")}`,
    );
  }
  const fatal = result.issues.filter((issue) => issue.severity === "error");
  if (fatal.length) {
    throw new Error(
      `Apartment template invalid: ${fatal.map((i) => i.message).join("; ")}`,
    );
  }
  return result.project;
}
