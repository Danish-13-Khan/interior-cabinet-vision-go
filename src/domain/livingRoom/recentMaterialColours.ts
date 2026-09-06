import type { InteriorProject } from "../interiorProject";
import { normalizeHexColour } from "./materialColourFormat";

export type RecentMaterialColour = {
  color: string;
  materialId?: string;
};

const EXTENSION_KEY = "recentMaterialColours";
const MAX_RECENT = 8;

function readList(project: InteriorProject): RecentMaterialColour[] {
  const raw = project.extensions?.[EXTENSION_KEY];
  if (!Array.isArray(raw)) return [];
  const out: RecentMaterialColour[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const color = normalizeHexColour(String((item as RecentMaterialColour).color ?? ""));
    if (!color) continue;
    const materialId = (item as RecentMaterialColour).materialId;
    out.push({
      color,
      materialId: typeof materialId === "string" ? materialId : undefined,
    });
  }
  return out;
}

export function listRecentMaterialColours(project: InteriorProject): RecentMaterialColour[] {
  return readList(project);
}

/** Ring-buffer recent colours on the project document (persists with save/reopen). */
export function recordRecentMaterialColour(
  project: InteriorProject,
  entry: RecentMaterialColour,
): InteriorProject {
  const color = normalizeHexColour(entry.color);
  if (!color) return project;
  const nextEntry: RecentMaterialColour = {
    color,
    materialId: entry.materialId,
  };
  const previous = readList(project).filter((item) => item.color !== color);
  const recent = [nextEntry, ...previous].slice(0, MAX_RECENT);
  return {
    ...project,
    extensions: { ...project.extensions, [EXTENSION_KEY]: recent },
  };
}
