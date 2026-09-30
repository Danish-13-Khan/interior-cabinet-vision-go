import { isStorageQuotaError, PROJECT_BROWSER_STORAGE_KEY } from "../projectBrowserStorage";
import type { ProjectIndexEntry } from "./types";

export type StoredBrowserList = {
  index: ProjectIndexEntry[];
  legacy: unknown[] | null;
};

function isIndexEntry(value: unknown): value is ProjectIndexEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ProjectIndexEntry>;
  return typeof entry.id === "string" && typeof entry.name === "string" && typeof entry.updatedAt === "string";
}

export function readStoredBrowserList(raw: string | null): StoredBrowserList {
  if (!raw) return { index: [], legacy: null };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { index: [], legacy: null };
    const legacy = parsed.some((item) => item && typeof item === "object" && "project" in item);
    if (legacy) return { index: [], legacy: parsed };
    return {
      index: parsed.filter(isIndexEntry).map((entry) => ({
        id: entry.id,
        name: entry.name,
        updatedAt: entry.updatedAt,
        thumbnailKey: typeof entry.thumbnailKey === "string" ? entry.thumbnailKey : null,
      })),
      legacy: null,
    };
  } catch {
    return { index: [], legacy: null };
  }
}

export function writeProjectIndex(
  entries: ProjectIndexEntry[],
  storage: Pick<Storage, "setItem">,
): "saved" | "quota-exceeded" | "failed" {
  try {
    storage.setItem(PROJECT_BROWSER_STORAGE_KEY, JSON.stringify(entries));
    return "saved";
  } catch (error) {
    return isStorageQuotaError(error) ? "quota-exceeded" : "failed";
  }
}
