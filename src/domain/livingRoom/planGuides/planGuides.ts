import type { InteriorProject } from "../../interiorProject";

/** A plan grid line: `axis: "x"` is vertical (constant X), `"z"` is horizontal (constant Z). */
export type PlanGuide = {
  id: string;
  axis: "x" | "z";
  positionMm: number;
  label?: string;
  locked?: boolean;
};

export type PlanGuidePatch = Partial<Pick<PlanGuide, "positionMm" | "label" | "locked">>;

function readGuide(value: unknown): PlanGuide | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<PlanGuide>;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (raw.axis !== "x" && raw.axis !== "z") return null;
  if (!Number.isFinite(raw.positionMm)) return null;
  return {
    id: raw.id,
    axis: raw.axis,
    positionMm: Number(raw.positionMm),
    ...(typeof raw.label === "string" && raw.label.trim() ? { label: raw.label.trim().slice(0, 12) } : {}),
    ...(raw.locked === true ? { locked: true } : {}),
  };
}

/** Guides live on the plan, not the underlay, so Replace / Remove underlay keeps them. */
export function getPlanGuides(project: InteriorProject): PlanGuide[] {
  const value = project.extensions?.planGuides;
  if (!Array.isArray(value)) return [];
  return value.map(readGuide).filter((guide): guide is PlanGuide => guide !== null);
}

export function setPlanGuides(project: InteriorProject, guides: readonly PlanGuide[]): InteriorProject {
  const extensions = { ...project.extensions };
  if (guides.length) extensions.planGuides = guides.map((guide) => ({ ...guide }));
  else delete extensions.planGuides;
  return { ...project, extensions };
}

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Architectural convention: vertical lines take letters (A, B…), horizontal take numbers (1, 2…). */
export function nextPlanGuideLabel(guides: readonly PlanGuide[], axis: PlanGuide["axis"]): string {
  const used = new Set(guides.filter((guide) => guide.axis === axis).map((guide) => guide.label));
  for (let index = 0; index < 999; index += 1) {
    const label = axis === "x"
      ? (LETTERS[index % LETTERS.length]! + (index >= LETTERS.length ? String(Math.floor(index / LETTERS.length)) : ""))
      : String(index + 1);
    if (!used.has(label)) return label;
  }
  return "";
}

export function createPlanGuideId(): string {
  return `guide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addPlanGuide(
  project: InteriorProject,
  input: { axis: PlanGuide["axis"]; positionMm: number; id?: string; label?: string },
): InteriorProject {
  const guides = getPlanGuides(project);
  const guide: PlanGuide = {
    id: input.id ?? createPlanGuideId(),
    axis: input.axis,
    positionMm: Math.round(input.positionMm),
    label: input.label ?? nextPlanGuideLabel(guides, input.axis),
  };
  return setPlanGuides(project, [...guides, guide]);
}

export function updatePlanGuide(project: InteriorProject, guideId: string, patch: PlanGuidePatch): InteriorProject {
  const guides = getPlanGuides(project);
  const target = guides.find((guide) => guide.id === guideId);
  if (!target) return project;
  if (target.locked && patch.positionMm !== undefined && patch.locked !== false) return project;
  const next: PlanGuide = { ...target, ...patch };
  if (patch.positionMm !== undefined) next.positionMm = Math.round(patch.positionMm);
  if (patch.label !== undefined) {
    const label = patch.label.trim().slice(0, 12);
    if (label) next.label = label;
    else delete next.label;
  }
  if (!next.locked) delete next.locked;
  return setPlanGuides(project, guides.map((guide) => (guide.id === guideId ? next : guide)));
}

export function removePlanGuide(project: InteriorProject, guideId: string): InteriorProject {
  const guides = getPlanGuides(project);
  if (!guides.some((guide) => guide.id === guideId)) return project;
  return setPlanGuides(project, guides.filter((guide) => guide.id !== guideId));
}
