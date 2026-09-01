import type { CabinetProject } from "../cabinetDimensions";
import { createCabinetConstruction } from "../cabinetConstruction";
import { clampCostingSettings, DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { clampProjectDrafting } from "../draftingAnnotations";
import { buildHardwareLines, normalizeCabinetHardware } from "../hardwareSystem";
import { clampJobMeta } from "../jobMeta";
import { productionIdentityBlocked } from "../cabinetIdentity";
import { createExportableProjectCutlist } from "../productionOutputs";
import { listProjectRooms } from "../projectRooms";
import { clampQuoteSettings, DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import { getProjectSheetSet } from "../sheetDocuments";
import {
  clampSheetOptimizerSettings,
  DEFAULT_SHEET_OPTIMIZER,
} from "../sheetStock";

export function stablePacketValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stablePacketValue).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stablePacketValue(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Canonical packet/report payload — placement, config, construction, hardware, cutlist, settings. */
export function createProductionPacketPayload(project: CabinetProject): unknown {
  const job = clampJobMeta(project.job);
  const preferences = project.preferences;
  const costing = clampCostingSettings(preferences?.costing ?? DEFAULT_COSTING_SETTINGS);
  const cabinets = [...project.cabinets].sort((left, right) => left.id.localeCompare(right.id));
  const rooms = [...listProjectRooms(project)].sort((left, right) => left.id.localeCompare(right.id));
  const hardwareSettings = {
    hingeId: costing.hingeId,
    drawerSlideId: costing.drawerSlideId,
    handleId: costing.handleId,
  };
  return {
    job: {
      revision: job.revision,
      projectNumber: job.projectNumber,
      customerName: job.customerName,
    },
    settings: {
      costing,
      quote: clampQuoteSettings(preferences?.quote ?? DEFAULT_QUOTE_SETTINGS),
      sheetOptimizer: clampSheetOptimizerSettings(
        preferences?.sheetOptimizer ?? DEFAULT_SHEET_OPTIMIZER,
      ),
    },
    identityBlocked: productionIdentityBlocked(project),
    activeRoomId: project.activeRoomId ?? rooms[0]?.id ?? "",
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      config: room.config,
    })),
    drafting: clampProjectDrafting(project.drafting),
    sheetSet: getProjectSheetSet(project),
    cabinets: cabinets.map((cabinet) => {
      const construction = createCabinetConstruction(cabinet.config);
      return {
        id: cabinet.id,
        name: cabinet.name,
        interiorObjectId: cabinet.interiorObjectId ?? "",
        placement: cabinet.placement,
        config: cabinet.config,
        hardware: normalizeCabinetHardware(cabinet.config.type, cabinet.config.hardware),
        hardwareLines: buildHardwareLines(cabinet, construction, hardwareSettings).map((line) => ({
          id: line.id,
          kind: line.kind,
          quantity: line.quantity,
        })),
        constructionParts: construction.parts.map((part) => ({
          id: part.id,
          category: part.category,
          quantity: part.quantity,
          lengthMm: part.lengthMm,
          widthMm: part.widthMm,
          thicknessMm: part.thicknessMm,
          material: part.materialLabel,
          finish: part.finishLabel,
          edgeBanding: part.edgeBandingLabel,
        })),
      };
    }),
    cutlist: createExportableProjectCutlist(project).map((line) => ({
      key: line.key,
      cabinetId: line.cabinetId,
      partId: line.partId,
      quantity: line.quantity,
      lengthMm: line.lengthMm,
      widthMm: line.widthMm,
      thicknessMm: line.thicknessMm,
      material: line.material,
      finish: line.finish,
      edgeBanding: line.edgeBanding,
    })),
  };
}
