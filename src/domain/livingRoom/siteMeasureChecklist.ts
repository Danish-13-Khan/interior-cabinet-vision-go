import type { InteriorProject } from "../interiorProject";
import { getLivingRoomPlanUnderlay } from "./planUnderlay";

export const SITE_MEASURE_USER_KEYS = [
  "wallsMeasured",
  "ceilingHeight",
  "doorSizes",
  "windowSizes",
] as const;

export type SiteMeasureUserKey = (typeof SITE_MEASURE_USER_KEYS)[number];

export type SiteMeasureChecklist = Partial<Record<SiteMeasureUserKey, boolean>>;

export type SiteMeasureChecklistItem = {
  key: SiteMeasureUserKey | "underlayImported" | "underlayCalibrated";
  label: string;
  checked: boolean;
  auto: boolean;
};

export function getSiteMeasureChecklist(project: InteriorProject): SiteMeasureChecklist {
  const value = project.extensions?.siteMeasureChecklist;
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const result: SiteMeasureChecklist = {};
  for (const key of SITE_MEASURE_USER_KEYS) {
    if (typeof source[key] === "boolean") result[key] = source[key];
  }
  return result;
}

export function setSiteMeasureChecklist(
  project: InteriorProject,
  checklist: SiteMeasureChecklist,
): InteriorProject {
  const extensions = { ...project.extensions };
  const cleaned: SiteMeasureChecklist = {};
  for (const key of SITE_MEASURE_USER_KEYS) {
    if (typeof checklist[key] === "boolean") cleaned[key] = checklist[key];
  }
  if (Object.keys(cleaned).length === 0) delete extensions.siteMeasureChecklist;
  else extensions.siteMeasureChecklist = cleaned;
  return { ...project, extensions };
}

export function toggleSiteMeasureChecklistItem(
  project: InteriorProject,
  key: SiteMeasureUserKey,
  value?: boolean,
): InteriorProject {
  const current = getSiteMeasureChecklist(project);
  const nextValue = value ?? !current[key];
  return setSiteMeasureChecklist(project, { ...current, [key]: nextValue });
}

/** Display rows: user toggles + auto underlay imported/calibrated. */
export function listSiteMeasureChecklistItems(project: InteriorProject): SiteMeasureChecklistItem[] {
  const stored = getSiteMeasureChecklist(project);
  const underlay = getLivingRoomPlanUnderlay(project);
  return [
    { key: "wallsMeasured", label: "Walls measured", checked: Boolean(stored.wallsMeasured), auto: false },
    { key: "ceilingHeight", label: "Ceiling height", checked: Boolean(stored.ceilingHeight), auto: false },
    { key: "doorSizes", label: "Door sizes + offsets", checked: Boolean(stored.doorSizes), auto: false },
    { key: "windowSizes", label: "Window sizes + offsets", checked: Boolean(stored.windowSizes), auto: false },
    { key: "underlayImported", label: "Underlay imported", checked: Boolean(underlay), auto: true },
    {
      key: "underlayCalibrated",
      label: "Underlay calibrated",
      checked: Boolean(underlay?.calibrated),
      auto: true,
    },
  ];
}
