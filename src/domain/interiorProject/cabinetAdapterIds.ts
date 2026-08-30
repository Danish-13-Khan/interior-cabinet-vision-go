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
