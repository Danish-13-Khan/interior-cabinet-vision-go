import type { InteriorProject } from "../interiorProject";

export type EstimateUnit = "each" | "m2" | "lm";
export type EstimateOverride = { rate?: number; excluded?: boolean; wastePercent?: number };
export type ManualEstimateLine = { id: string; roomId: string; label: string; unit: EstimateUnit; quantity: number; rate: number };
/** Customer-entered rate per measured category, e.g. `surface.wall`. Never seeded with invented market rates. */
export type EstimateCategoryRates = Record<string, number>;
export type InteriorEstimateState = { enabled: boolean; overrides: Record<string, EstimateOverride>; manual: ManualEstimateLine[]; categoryRates: EstimateCategoryRates };
const KEY = "interiorEstimate";
const finite = (v: unknown, fallback = 0) => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
export function readInteriorEstimate(project: InteriorProject): InteriorEstimateState {
  const raw = project.extensions?.[KEY] as Partial<InteriorEstimateState> | undefined;
  const overrides: Record<string, EstimateOverride> = {};
  for (const [id, row] of Object.entries(raw?.overrides ?? {})) {
    if (!row || typeof row !== "object") continue;
    overrides[id] = { ...(typeof row.rate === "number" && Number.isFinite(row.rate) && row.rate >= 0 ? { rate: row.rate } : {}),
      excluded: row.excluded === true, wastePercent: Math.min(100, finite(row.wastePercent)) };
  }
  const manual = Array.isArray(raw?.manual) ? raw.manual.filter((line) => line && typeof line.id === "string").map((line) => ({
    id: line.id, roomId: String(line.roomId ?? ""), label: String(line.label ?? "Custom item").slice(0, 120),
    unit: (["each", "m2", "lm"].includes(line.unit) ? line.unit : "each") as EstimateUnit,
    quantity: finite(line.quantity), rate: finite(line.rate),
  })) : [];
  const categoryRates: EstimateCategoryRates = {};
  for (const [key, value] of Object.entries(raw?.categoryRates ?? {})) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) categoryRates[key] = value;
  }
  return { enabled: raw?.enabled === true, overrides, manual, categoryRates };
}
export function writeInteriorEstimate(project: InteriorProject, state: InteriorEstimateState): InteriorProject {
  const next = { ...project, extensions: { ...project.extensions, [KEY]: state } };
  return { ...next, extensions: { ...next.extensions, [KEY]: readInteriorEstimate(next) } };
}
export function patchEstimateLine(project: InteriorProject, id: string, patch: EstimateOverride): InteriorProject {
  const state = readInteriorEstimate(project);
  return writeInteriorEstimate(project, { ...state, overrides: { ...state.overrides, [id]: { ...state.overrides[id], ...patch } } });
}
/** Clearing a category rate returns its lines to "needs a rate" rather than charging zero. */
export function setEstimateCategoryRate(project: InteriorProject, category: string, rate: number | null): InteriorProject {
  const state = readInteriorEstimate(project);
  const categoryRates = { ...state.categoryRates };
  if (rate === null) delete categoryRates[category]; else categoryRates[category] = rate;
  return writeInteriorEstimate(project, { ...state, categoryRates });
}
