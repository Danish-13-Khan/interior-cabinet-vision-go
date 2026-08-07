export const RECENT_FILES_STORAGE_KEY = "cabinet-designer-recent-files";
export const RECENT_FILES_LIMIT = 12;

export type RecentFileEntry = {
  path: string;
  name: string;
  openedAt: string;
};

export function createRecentFileEntry(
  path: string,
  openedAt: string = new Date().toISOString(),
): RecentFileEntry {
  const trimmed = path.trim();
  const name = trimmed.split(/[/\\]/).pop() || trimmed;
  return { path: trimmed, name, openedAt };
}

export function upsertRecentFile(
  entries: RecentFileEntry[],
  path: string,
  openedAt: string = new Date().toISOString(),
): RecentFileEntry[] {
  const next = createRecentFileEntry(path, openedAt);
  if (!next.path) return entries.slice(0, RECENT_FILES_LIMIT);
  return [
    next,
    ...entries.filter((entry) => entry.path !== next.path),
  ].slice(0, RECENT_FILES_LIMIT);
}

export function removeRecentFile(
  entries: RecentFileEntry[],
  path: string,
): RecentFileEntry[] {
  return entries.filter((entry) => entry.path !== path);
}

export function clampRecentFiles(value: unknown): RecentFileEntry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: RecentFileEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const path = typeof (item as RecentFileEntry).path === "string"
      ? (item as RecentFileEntry).path.trim()
      : "";
    if (!path || seen.has(path)) continue;
    seen.add(path);
    result.push(
      createRecentFileEntry(
        path,
        typeof (item as RecentFileEntry).openedAt === "string"
          ? (item as RecentFileEntry).openedAt
          : new Date(0).toISOString(),
      ),
    );
    if (result.length >= RECENT_FILES_LIMIT) break;
  }
  return result;
}

export function readRecentFiles(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): RecentFileEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(RECENT_FILES_STORAGE_KEY);
    if (!raw) return [];
    return clampRecentFiles(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function persistRecentFiles(
  entries: RecentFileEntry[],
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
) {
  if (!storage) return;
  storage.setItem(
    RECENT_FILES_STORAGE_KEY,
    JSON.stringify(clampRecentFiles(entries)),
  );
}
