import { getDefaultCabinetConfig, type CabinetProject } from "../cabinetDimensions";
import { createDefaultJobMeta } from "../jobMeta";
import { DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import type { RoomConfig } from "../roomModel";
import type { StorageLike } from "../saas/accountTypes";

export function memoryStorage(failSet = false): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      if (failSet) {
        const err = new Error("QuotaExceededError");
        err.name = "QuotaExceededError";
        throw err;
      }
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

export const testRoom: RoomConfig = {
  dimensions: {
    widthMm: 6000,
    depthMm: 4000,
    heightMm: 2800,
    wallThicknessMm: 120,
    showBackWall: true,
    showLeftWall: true,
    showRightWall: true,
  },
  doors: [],
  windows: [],
};

export function makeCabinetProject(opts?: {
  projectNumber?: string;
  ledgerProjectId?: string;
  interiorId?: string;
}): CabinetProject {
  return {
    version: 1,
    cabinets: [
      {
        id: "cab-1",
        name: "Base",
        placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
        config: getDefaultCabinetConfig("base"),
      },
    ],
    job: createDefaultJobMeta({
      customerName: "Rivera",
      projectNumber: opts?.projectNumber ?? "",
      revision: "A",
      status: "draft",
    }),
    preferences: {
      snapSizeMm: 50,
      showGrid: true,
      autoSaveToBrowser: true,
      quote: { ...DEFAULT_QUOTE_SETTINGS },
    },
    ledgerProjectId: opts?.ledgerProjectId,
    interiorDocument: opts?.interiorId
      ? ({ id: opts.interiorId } as CabinetProject["interiorDocument"])
      : undefined,
  };
}
