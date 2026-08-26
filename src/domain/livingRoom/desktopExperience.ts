import {
  createInteriorTechnicalPlanSvg,
  loadInteriorProjectFile,
  type InteriorProject,
} from "../interiorProject";

export const LIVING_ROOM_RECOVERY_STORAGE_KEY =
  "cabinet-designer-living-room-recovery";
export const LIVING_ROOM_RECOVERY_VERSION = 1;

export type LivingRoomRecoverySnapshot = {
  version: typeof LIVING_ROOM_RECOVERY_VERSION;
  savedAt: string;
  project: InteriorProject;
};

type ReadRecoveryResult = {
  snapshot: LivingRoomRecoverySnapshot | null;
  error: string | null;
};

function storageOrDefault<T>(storage?: T | null): T | Storage | null {
  if (storage !== undefined) return storage;
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function interiorProjectFingerprint(project: InteriorProject) {
  return JSON.stringify({ ...project, updatedAt: "" });
}

export function createLivingRoomRecoverySnapshot(
  project: InteriorProject,
  savedAt = new Date().toISOString(),
): LivingRoomRecoverySnapshot {
  return {
    version: LIVING_ROOM_RECOVERY_VERSION,
    savedAt,
    project,
  };
}

export function readLivingRoomRecovery(
  storage?: Pick<Storage, "getItem" | "removeItem"> | null,
): ReadRecoveryResult {
  const target = storageOrDefault(storage);
  if (!target) return { snapshot: null, error: null };

  const raw = target.getItem(LIVING_ROOM_RECOVERY_STORAGE_KEY);
  if (!raw) return { snapshot: null, error: null };

  try {
    const parsed = JSON.parse(raw) as Partial<LivingRoomRecoverySnapshot>;
    if (
      parsed.version !== LIVING_ROOM_RECOVERY_VERSION ||
      typeof parsed.savedAt !== "string" ||
      !parsed.project
    ) {
      throw new Error("Recovery data is incomplete.");
    }
    const loaded = loadInteriorProjectFile(parsed.project);
    if (!loaded.document.rooms.some((room) => room.roomType === "living-room")) {
      throw new Error("Recovery data does not contain a living room.");
    }
    return {
      snapshot: {
        version: LIVING_ROOM_RECOVERY_VERSION,
        savedAt: parsed.savedAt,
        project: loaded.document,
      },
      error: null,
    };
  } catch (error) {
    target.removeItem(LIVING_ROOM_RECOVERY_STORAGE_KEY);
    return {
      snapshot: null,
      error: error instanceof Error ? error.message : "Recovery data is invalid.",
    };
  }
}

export function persistLivingRoomRecovery(
  snapshot: LivingRoomRecoverySnapshot,
  storage?: Pick<Storage, "setItem"> | null,
) {
  storageOrDefault(storage)?.setItem(
    LIVING_ROOM_RECOVERY_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
}

export function clearLivingRoomRecovery(
  storage?: Pick<Storage, "removeItem"> | null,
) {
  storageOrDefault(storage)?.removeItem(LIVING_ROOM_RECOVERY_STORAGE_KEY);
}

/** Creates a deterministic plan preview without needing an active WebGL canvas. */
export function createLivingRoomPlanThumbnail(project: InteriorProject) {
  const svg = createInteriorTechnicalPlanSvg(project, {
    width: 300, height: 184, title: project.name, showDimensions: false,
  });
  if (!svg) return "";
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
