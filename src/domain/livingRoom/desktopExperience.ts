import {
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

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]!);
}

/** Creates a deterministic plan preview without needing an active WebGL canvas. */
export function createLivingRoomPlanThumbnail(project: InteriorProject) {
  const room = project.rooms.find((item) => item.id === project.activeRoomId);
  if (!room) return "";
  const width = room.dimensions.widthMm;
  const depth = room.dimensions.depthMm;
  const scaleX = 280 / width;
  const scaleZ = 164 / depth;
  const objectMarkup = project.objects
    .filter((object) => object.roomId === room.id)
    .map((object) => {
      const objectWidth = Math.max(4, object.dimensions.widthMm * scaleX);
      const objectDepth = Math.max(4, object.dimensions.depthMm * scaleZ);
      const x = 150 + object.position.x * scaleX;
      const y = 92 + object.position.z * scaleZ;
      return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${object.rotation.y.toFixed(2)})"><rect x="${(-objectWidth / 2).toFixed(2)}" y="${(-objectDepth / 2).toFixed(2)}" width="${objectWidth.toFixed(2)}" height="${objectDepth.toFixed(2)}" rx="2"/><title>${escapeXml(object.name)}</title></g>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="184" viewBox="0 0 300 184"><rect width="300" height="184" fill="#dfe6ea"/><rect x="10" y="10" width="280" height="164" fill="#f8f9f7" stroke="#344751" stroke-width="4"/><g fill="#bfa77d" stroke="#40515a" stroke-width="1.5">${objectMarkup}</g><text x="18" y="28" fill="#32444e" font-family="sans-serif" font-size="10" font-weight="700">${escapeXml(project.name)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
