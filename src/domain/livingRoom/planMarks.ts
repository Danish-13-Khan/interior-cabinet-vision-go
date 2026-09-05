import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { readCabinetIdentity } from "../cabinetIdentity";
import { isCabinetRunFiller } from "./cabinetRunFillers";
import { isKitchenAppliancePlanObject, planObjectFootprintKind } from "./planObjectFootprint";

export type PlanMarksAudience = "sales" | "technical";

export type PlanMarksSettings = {
  enabled: boolean;
  audience?: PlanMarksAudience;
};

export const DEFAULT_PLAN_MARKS: PlanMarksSettings = {
  enabled: false,
  audience: "sales",
};

function markLetter(object: InteriorObjectEntity): string {
  if (isCabinetRunFiller(object) || object.category === "filler") return "F";
  if (isKitchenAppliancePlanObject(object) || planObjectFootprintKind(object) === "appliance") return "A";

  const identity = readCabinetIdentity(object);
  const type = identity?.cabinetType;
  if (type === "base") return "B";
  if (type === "wall") return "W";
  if (type === "tall") return "T";
  if (type === "drawer") return "D";
  if (type === "open-shelf") return "S";
  if (type === "sink") return "A";
  if (type === "corner") return "C";
  if (type === "almirah") return "M";

  const footprint = planObjectFootprintKind(object);
  if (footprint === "base") return "B";
  if (footprint === "wall") return "W";
  if (footprint === "tall") return "T";
  if (footprint === "filler") return "F";

  if (object.kind === "cabinet") return "B";
  return "X";
}

/** Compact plan mark such as B600, F50, A900. */
export function formatPlanMark(object: Pick<InteriorObjectEntity, "category" | "kind" | "catalogItemId" | "dimensions" | "extensions" | "name"> & Partial<InteriorObjectEntity>): string {
  const letter = markLetter(object as InteriorObjectEntity);
  const width = Math.round(object.dimensions.widthMm);
  return `${letter}${width}`;
}

export function readPlanMarksSettings(project: InteriorProject): PlanMarksSettings {
  const value = project.extensions?.planMarks;
  if (!value || typeof value !== "object") return { ...DEFAULT_PLAN_MARKS };
  const source = value as Record<string, unknown>;
  return {
    enabled: Boolean(source.enabled),
    audience: source.audience === "technical" ? "technical" : "sales",
  };
}

export function setPlanMarksSettings(
  project: InteriorProject,
  patch: Partial<PlanMarksSettings>,
): InteriorProject {
  const current = readPlanMarksSettings(project);
  const next: PlanMarksSettings = {
    enabled: patch.enabled ?? current.enabled,
    audience: patch.audience ?? current.audience ?? "sales",
  };
  return {
    ...project,
    extensions: {
      ...project.extensions,
      planMarks: next,
    },
  };
}

export function formatCabinetInlineDims(widthMm: number, depthMm: number): string {
  return `W ${Math.round(widthMm)} × D ${Math.round(depthMm)}`;
}
