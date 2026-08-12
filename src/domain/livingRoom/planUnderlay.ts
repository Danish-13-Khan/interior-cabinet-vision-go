import type { InteriorProject } from "../interiorProject";

export type LivingRoomPlanUnderlay = {
  fileName: string;
  dataUrl: string;
  widthMm: number;
  heightMm: number;
  opacity: number;
};

export function getLivingRoomPlanUnderlay(
  project: InteriorProject,
): LivingRoomPlanUnderlay | null {
  const value = project.extensions?.planUnderlay;
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<LivingRoomPlanUnderlay>;
  if (
    typeof candidate.fileName !== "string" ||
    typeof candidate.dataUrl !== "string" ||
    !candidate.dataUrl.startsWith("data:image/") ||
    !Number.isFinite(candidate.widthMm) ||
    !Number.isFinite(candidate.heightMm) ||
    !Number.isFinite(candidate.opacity)
  ) return null;
  return {
    fileName: candidate.fileName,
    dataUrl: candidate.dataUrl,
    widthMm: Math.max(100, Number(candidate.widthMm)),
    heightMm: Math.max(100, Number(candidate.heightMm)),
    opacity: Math.min(1, Math.max(0.05, Number(candidate.opacity))),
  };
}

export function setLivingRoomPlanUnderlay(
  project: InteriorProject,
  underlay: LivingRoomPlanUnderlay | null,
): InteriorProject {
  const extensions = { ...project.extensions };
  if (underlay) extensions.planUnderlay = { ...underlay };
  else delete extensions.planUnderlay;
  return { ...project, extensions };
}
