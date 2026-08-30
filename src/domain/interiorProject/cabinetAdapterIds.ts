import { clampJobMeta, formatJobTitle } from "../jobMeta";
import type { CabinetProject } from "../cabinetDimensions";
import type { AdapterWallSide } from "./cabinetAdapterShared";

export function projectSlug(project: CabinetProject) {
  const job = clampJobMeta(project.job);
  const source = job.projectNumber || job.customerName || "interior-project";
  return source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "interior-project";
}

export function projectName(project: CabinetProject) {
  const job = clampJobMeta(project.job);
  return formatJobTitle(job, "Interior Project");
}

export function wallId(roomId: string, side: AdapterWallSide) {
  return `${roomId}:wall:${side}`;
}

export function openingId(roomId: string, kind: "door" | "window", sourceId: string) {
  return `${roomId}:${kind}:${sourceId}`;
}

export function objectId(roomId: string, sourceId: string) {
  return `${roomId}:object:${sourceId}`;
}

const DEFAULT_CABINET_PROJECT_NUMBER = "JOB-001";

function fileStem(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "interior-project";
}

/** Cabinet CAD seed job — not an Interiors project name. */
export function isDefaultCabinetJob(job: ReturnType<typeof clampJobMeta>) {
  return !job.customerName.trim()
    && (job.projectNumber.trim() === "" || job.projectNumber.trim() === DEFAULT_CABINET_PROJECT_NUMBER);
}

/** Download name: interiors title unless a real job number is present (GCR-001, etc.). */
export function interiorProjectFileName(
  documentName: string,
  job?: Parameters<typeof clampJobMeta>[0],
) {
  const meta = clampJobMeta(job);
  const interiors = documentName.trim();
  const source = isDefaultCabinetJob(meta)
    ? interiors || formatJobTitle(meta, "interior-project")
    : formatJobTitle(meta, interiors || "interior-project");
  return `${fileStem(source)}.json`;
}
