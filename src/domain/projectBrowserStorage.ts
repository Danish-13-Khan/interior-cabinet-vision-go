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

/** Replace the saved copy of the same Interiors document instead of creating stale duplicates. */
export function upsertSavedProjectEntry(
  projects: SavedProjectBrowserEntry[],
  entry: SavedProjectBrowserEntry,
  limit = 16,
): SavedProjectBrowserEntry[] {
  const documentId = entry.project.interiorDocument?.id;
  const remaining = projects.filter((item) => {
    if (documentId) return item.project.interiorDocument?.id !== documentId;
    return item.id !== entry.id;
  });
  return [entry, ...remaining].slice(0, limit);
}

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

export type PersistSavedProjectsResult = "saved" | "quota-exceeded" | "failed" | "unavailable";

export const PROJECT_BROWSER_QUOTA_MESSAGE =
  "Project too large for browser autosave; save it to a file instead.";

export function isStorageQuotaError(error: unknown): boolean {
  if (!(error instanceof Error) && !(typeof DOMException !== "undefined" && error instanceof DOMException)) {
    return false;
  }
  const { name } = error as { name: string };
  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED";
}

/** Never throws: localStorage holds ~5 MB per origin and a large project must not take the app down. */
export function persistSavedProjects(
  projects: SavedProjectBrowserEntry[],
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): PersistSavedProjectsResult {
  if (!storage) return "unavailable";
  try {
    storage.setItem(PROJECT_BROWSER_STORAGE_KEY, JSON.stringify(projects));
    return "saved";
  } catch (error) {
    return isStorageQuotaError(error) ? "quota-exceeded" : "failed";
  }
}
