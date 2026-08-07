import {
  clampWorkshopLibrary,
  createEmptyWorkshopLibrary,
} from "./clamp";
import {
  WORKSHOP_LIBRARY_SCHEMA_VERSION,
  WORKSHOP_LIBRARY_STORAGE_KEY,
  type WorkshopLibraryPack,
} from "./types";

export function loadWorkshopLibrary(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): WorkshopLibraryPack {
  if (!storage) return createEmptyWorkshopLibrary();
  try {
    const raw = storage.getItem(WORKSHOP_LIBRARY_STORAGE_KEY);
    if (!raw) return createEmptyWorkshopLibrary();
    return clampWorkshopLibrary(JSON.parse(raw) as WorkshopLibraryPack);
  } catch {
    return createEmptyWorkshopLibrary();
  }
}

export function saveWorkshopLibrary(
  pack: WorkshopLibraryPack,
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
) {
  if (!storage) return;
  const next = clampWorkshopLibrary({
    ...pack,
    updatedAt: new Date().toISOString(),
  });
  storage.setItem(WORKSHOP_LIBRARY_STORAGE_KEY, JSON.stringify(next));
}

export function exportWorkshopLibraryJson(pack: WorkshopLibraryPack): string {
  return JSON.stringify(clampWorkshopLibrary(pack), null, 2);
}

export function importWorkshopLibraryJson(raw: string): WorkshopLibraryPack {
  const parsed = JSON.parse(raw) as WorkshopLibraryPack;
  return clampWorkshopLibrary(parsed);
}

export function mergeWorkshopLibraries(
  base: WorkshopLibraryPack,
  incoming: WorkshopLibraryPack,
): WorkshopLibraryPack {
  const mergeById = <T extends { id: string; version: number }>(
    current: T[],
    next: T[],
  ): T[] => {
    const map = new Map(current.map((item) => [item.id, item]));
    for (const item of next) {
      const existing = map.get(item.id);
      if (!existing || item.version >= existing.version) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values());
  };

  return clampWorkshopLibrary({
    schemaVersion: WORKSHOP_LIBRARY_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    doorStyles: mergeById(base.doorStyles, incoming.doorStyles),
    materials: mergeById(base.materials, incoming.materials),
    hardware: mergeById(base.hardware, incoming.hardware),
    countertops: mergeById(base.countertops, incoming.countertops),
    standardsPacks: mergeById(base.standardsPacks, incoming.standardsPacks),
    cabinetPresets: mergeById(base.cabinetPresets, incoming.cabinetPresets),
  });
}
