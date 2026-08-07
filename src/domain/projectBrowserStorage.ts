import {
  clampCabinetProject,
  type CabinetProject,
} from "./cabinetDimensions";
import { clampJobMeta, formatJobTitle } from "./jobMeta";
import type { RoomConfig } from "./roomModel";

export const PROJECT_BROWSER_STORAGE_KEY = "cabinet-designer-project-browser";

export type SavedProjectBrowserEntry = {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: string;
  project: CabinetProject;
  room: RoomConfig;
};

export function getProjectDisplayName(project: CabinetProject, count: number) {
  const job = clampJobMeta(project.job);
  if (job.projectNumber || job.customerName) {
    return formatJobTitle(job);
  }
  const lead = project.cabinets[0]?.name ?? "Room Layout";
  return project.cabinets.length > 1
    ? `${lead} + ${project.cabinets.length - 1} more`
    : `${lead} ${count}`;
}

export function readSavedProjects(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): SavedProjectBrowserEntry[] {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(PROJECT_BROWSER_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedProjectBrowserEntry[];
    return parsed.map((entry) => ({
      ...entry,
      project: clampCabinetProject(entry.project),
    }));
  } catch {
    return [];
  }
}

export function persistSavedProjects(
  projects: SavedProjectBrowserEntry[],
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
) {
  if (!storage) return;
  storage.setItem(PROJECT_BROWSER_STORAGE_KEY, JSON.stringify(projects));
}
