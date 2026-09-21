import { dwgPreviewDataUrl } from "./dwgGeometry";
import { readDwgSource, type DwgSource } from "./dwgSource";
import type { InteriorProject } from "../interiorProject";

export type LivingRoomPlanUnderlay = {
  sourceType?: "dwg";
  dwg?: DwgSource;
  importReport?: string;
  fileName: string;
  dataUrl: string;
  widthMm: number;
  heightMm: number;
  opacity: number;
  xMm?: number;
  zMm?: number;
  rotationDeg?: number;
  locked?: boolean;
  hidden?: boolean;
  calibrated?: boolean;
  /** Width/height captured at import — used by Reset scale. */
  importWidthMm?: number;
  importHeightMm?: number;
};

function optionalBool(value: unknown): boolean {
  return value === true;
}

export function getLivingRoomPlanUnderlay(
  project: InteriorProject,
): LivingRoomPlanUnderlay | null {
  const value = project.extensions?.planUnderlay;
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<LivingRoomPlanUnderlay>;
  const dwg = readDwgSource(candidate.dwg);
  const dataUrl = dwg
    ? dwgPreviewDataUrl(dwg.preview, dwg.hiddenLayers)
    : typeof candidate.dataUrl === "string" ? candidate.dataUrl : "";
  if (
    typeof candidate.fileName !== "string" ||
    !dataUrl.startsWith("data:image/") ||
    !Number.isFinite(candidate.widthMm) ||
    !Number.isFinite(candidate.heightMm) ||
    !Number.isFinite(candidate.opacity)
  ) return null;
  // Uniform floor so neither axis clamps independently and warps aspect.
  const rawW = Number(candidate.widthMm);
  const rawH = Number(candidate.heightMm);
  let widthMm: number;
  let heightMm: number;
  if (rawW > 0 && rawH > 0) {
    const uplift = candidate.sourceType === "dwg" ? 1 : Math.max(1, 100 / rawW, 100 / rawH);
    widthMm = rawW * uplift;
    heightMm = rawH * uplift;
  } else {
    widthMm = Math.max(100, rawW);
    heightMm = Math.max(100, rawH);
  }
  return {
    dwg,
    importReport: typeof candidate.importReport === "string" ? candidate.importReport : undefined,
    sourceType: candidate.sourceType === "dwg" ? "dwg" : undefined,
    fileName: candidate.fileName,
    dataUrl,
    widthMm,
    heightMm,
    opacity: Math.min(1, Math.max(0.05, Number(candidate.opacity))),
    xMm: Number.isFinite(candidate.xMm) ? Number(candidate.xMm) : 0,
    zMm: Number.isFinite(candidate.zMm) ? Number(candidate.zMm) : 0,
    rotationDeg: Number.isFinite(candidate.rotationDeg) ? Number(candidate.rotationDeg) : 0,
    locked: optionalBool(candidate.locked),
    hidden: optionalBool(candidate.hidden),
    calibrated: optionalBool(candidate.calibrated),
    importWidthMm: Number.isFinite(candidate.importWidthMm) ? Number(candidate.importWidthMm) : undefined,
    importHeightMm: Number.isFinite(candidate.importHeightMm) ? Number(candidate.importHeightMm) : undefined,
  };
}

export function setLivingRoomPlanUnderlay(
  project: InteriorProject,
  underlay: LivingRoomPlanUnderlay | null,
): InteriorProject {
  const extensions = { ...project.extensions };
  if (underlay) {
    const persisted = { ...underlay };
    if (readDwgSource(underlay.dwg)) persisted.dataUrl = "";
    extensions.planUnderlay = persisted;
  } else delete extensions.planUnderlay;
  return { ...project, extensions };
}
