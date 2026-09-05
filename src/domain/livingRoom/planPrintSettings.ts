import type { InteriorProject } from "../interiorProject";

export type PlanPrintAudience = "sales" | "technical";

export type PlanPrintLayers = {
  furniture: boolean;
  cabinets: boolean;
  openings: boolean;
  dims: boolean;
  referenceDims: boolean;
  marks: boolean;
  labels: boolean;
  grid: boolean;
  underlay: boolean;
};

export type PlanPrintSettings = {
  audience: PlanPrintAudience;
  layers: PlanPrintLayers;
  companyName?: string;
  logoDataUrl?: string | null;
  jobName?: string;
  customerName?: string;
};

export const SALES_PLAN_PRINT_LAYERS: PlanPrintLayers = {
  furniture: true,
  cabinets: true,
  openings: true,
  dims: true,
  referenceDims: false,
  marks: true,
  labels: true,
  grid: false,
  underlay: false,
};

export const TECHNICAL_PLAN_PRINT_LAYERS: PlanPrintLayers = {
  furniture: false,
  cabinets: true,
  openings: true,
  dims: true,
  referenceDims: true,
  marks: true,
  labels: true,
  grid: false,
  underlay: false,
};

export const DEFAULT_PLAN_PRINT_SETTINGS: PlanPrintSettings = {
  audience: "sales",
  layers: { ...SALES_PLAN_PRINT_LAYERS },
};

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readLayers(source: Record<string, unknown>, fallback: PlanPrintLayers): PlanPrintLayers {
  const raw = source.layers;
  if (!raw || typeof raw !== "object") return { ...fallback };
  const layers = raw as Record<string, unknown>;
  return {
    furniture: asBoolean(layers.furniture, fallback.furniture),
    cabinets: asBoolean(layers.cabinets, fallback.cabinets),
    openings: asBoolean(layers.openings, fallback.openings),
    dims: asBoolean(layers.dims, fallback.dims),
    referenceDims: asBoolean(layers.referenceDims, fallback.referenceDims),
    marks: asBoolean(layers.marks, fallback.marks),
    labels: asBoolean(layers.labels, fallback.labels),
    grid: asBoolean(layers.grid, fallback.grid),
    underlay: asBoolean(layers.underlay, fallback.underlay),
  };
}

export function applyPlanPrintPreset(audience: PlanPrintAudience): PlanPrintSettings {
  return {
    audience,
    layers: audience === "technical"
      ? { ...TECHNICAL_PLAN_PRINT_LAYERS }
      : { ...SALES_PLAN_PRINT_LAYERS },
  };
}

export function readPlanPrintSettings(project: InteriorProject): PlanPrintSettings {
  const value = project.extensions?.planPrint;
  if (!value || typeof value !== "object") return { ...DEFAULT_PLAN_PRINT_SETTINGS, layers: { ...DEFAULT_PLAN_PRINT_SETTINGS.layers } };
  const source = value as Record<string, unknown>;
  const audience: PlanPrintAudience = source.audience === "technical" ? "technical" : "sales";
  const defaults = applyPlanPrintPreset(audience);
  return {
    audience,
    layers: readLayers(source, defaults.layers),
    companyName: typeof source.companyName === "string" ? source.companyName : undefined,
    logoDataUrl: typeof source.logoDataUrl === "string"
      ? source.logoDataUrl
      : source.logoDataUrl === null
        ? null
        : undefined,
    jobName: typeof source.jobName === "string" ? source.jobName : undefined,
    customerName: typeof source.customerName === "string" ? source.customerName : undefined,
  };
}

export function setPlanPrintSettings(
  project: InteriorProject,
  patch: Omit<Partial<PlanPrintSettings>, "layers"> & { layers?: Partial<PlanPrintLayers> },
): InteriorProject {
  const current = readPlanPrintSettings(project);
  const next: PlanPrintSettings = {
    audience: patch.audience ?? current.audience,
    layers: {
      ...current.layers,
      ...(patch.layers ?? {}),
    },
    companyName: patch.companyName !== undefined ? patch.companyName : current.companyName,
    logoDataUrl: patch.logoDataUrl !== undefined ? patch.logoDataUrl : current.logoDataUrl,
    jobName: patch.jobName !== undefined ? patch.jobName : current.jobName,
    customerName: patch.customerName !== undefined ? patch.customerName : current.customerName,
  };
  return {
    ...project,
    extensions: {
      ...project.extensions,
      planPrint: next,
    },
  };
}

export function applyPlanPrintPresetToProject(
  project: InteriorProject,
  audience: PlanPrintAudience,
): InteriorProject {
  const current = readPlanPrintSettings(project);
  const preset = applyPlanPrintPreset(audience);
  return setPlanPrintSettings(project, {
    ...preset,
    companyName: current.companyName,
    logoDataUrl: current.logoDataUrl,
    jobName: current.jobName,
    customerName: current.customerName,
  });
}
