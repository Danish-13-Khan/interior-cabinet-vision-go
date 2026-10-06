import { clampCostingSettings } from "../costingSettings";
import { clampProjectStandards } from "../projectStandards";
import { clampJobMeta } from "../jobMeta";
import { applyWallMountPlacementFix } from "../manufacturingRules";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
} from "../draftingAnnotations";
import { clampProjectSheetSet } from "../sheetDocuments";
import {
  clampQuoteHistory,
  clampQuoteSettings,
} from "../quoteSettings";
import {
  clampReviewNotes,
  clampRevisionHistory,
} from "../projectReview/clamp";
import { clampSheetOptimizerSettings } from "../sheetStock";
import type {
  CabinetPlacement,
  CabinetProject, RoomBounds,
} from "./types";
import { CABINET_GRID_SNAP_MM, defaultCabinetProject } from "./defaults";
import {
  clampCabinetPlacement,
  getDefaultBottomOffsetMm,
  normalizeRotationAngle,
  snapMillimetresToGrid,
} from "./placement";
import { cabinetPlacementGridMm, clampCabinetConfig } from "./clampConfig";

// Public clamp API (split across modules; this path stays the stable import).
export {
  clampCabinetDepth,
  clampCabinetDimensions,
  clampCabinetHeight,
  clampCabinetWidth,
  clampDrawerCount,
  clampShelfCount,
  clampToeKickHeight,
  clampToeKickInset,
} from "./clampScalars";
export { cabinetPlacementGridMm, clampCabinetConfig } from "./clampConfig";

export function clampCabinetProject(project: CabinetProject, roomBounds?: RoomBounds): CabinetProject {
  const layers = Array.isArray(project.layers) && project.layers.length > 0
    ? project.layers.map((layer, index) => ({
        id: layer.id || `layer-${index + 1}`,
        name: layer.name?.trim() || `Layer ${index + 1}`,
        visible: layer.visible !== false,
        locked: Boolean(layer.locked),
      }))
    : [...(defaultCabinetProject.layers ?? [])];
  const groups = Array.isArray(project.groups)
    ? project.groups.map((group, index) => ({
        id: group.id || `group-${index + 1}`,
        name: group.name?.trim() || `Group ${index + 1}`,
      }))
    : [];
  const validLayerIds = new Set(layers.map((layer) => layer.id));
  const validGroupIds = new Set(groups.map((group) => group.id));
  const defaultLayerId = layers[0]?.id ?? "layer-default";

  return {
    version: 1,
    cabinets: project.cabinets.map((cabinet, index) => ({
      ...cabinet,
      id: cabinet.id || `cabinet-${index + 1}`,
      name: cabinet.name || `Cabinet ${index + 1}`,
      layerId:
        cabinet.layerId && validLayerIds.has(cabinet.layerId)
          ? cabinet.layerId
          : defaultLayerId,
      groupId:
        cabinet.groupId && validGroupIds.has(cabinet.groupId)
          ? cabinet.groupId
          : null,
      config: clampCabinetConfig(cabinet.config),
      placement: (() => {
        const type = cabinet.config?.type ?? "base";
        const rawPlacement = {
          x: Number.isFinite(cabinet.placement?.x) ? cabinet.placement.x : index * 1200,
          y: Number.isFinite(cabinet.placement?.y)
            ? cabinet.placement.y
            : getDefaultBottomOffsetMm(type),
          z: Number.isFinite(cabinet.placement?.z) ? cabinet.placement.z : 0,
          rotation: normalizeRotationAngle(cabinet.placement?.rotation ?? 0),
          attachment:
            cabinet.placement?.attachment === "back-wall" ||
            cabinet.placement?.attachment === "left-wall" ||
            cabinet.placement?.attachment === "right-wall"
              ? cabinet.placement.attachment
              : "floor",
        } as CabinetPlacement;
        const mounted = applyWallMountPlacementFix(type, rawPlacement).placement;
        return clampCabinetPlacement(
          mounted,
          clampCabinetConfig(cabinet.config).dimensions, roomBounds,
          cabinetPlacementGridMm(cabinet.config),
        );
      })(),
    })),
    layers,
    groups,
    preferences: {
      snapSizeMm:
        project.preferences?.snapSizeMm && Number.isFinite(project.preferences.snapSizeMm)
          ? Math.max(10, Math.min(500, snapMillimetresToGrid(project.preferences.snapSizeMm, 10)))
          : defaultCabinetProject.preferences?.snapSizeMm ?? CABINET_GRID_SNAP_MM,
      showGrid: project.preferences?.showGrid !== false,
      autoSaveToBrowser: project.preferences?.autoSaveToBrowser !== false,
      costing: clampCostingSettings(
        project.preferences?.costing ?? defaultCabinetProject.preferences?.costing,
      ),
      quote: clampQuoteSettings(
        project.preferences?.quote ?? defaultCabinetProject.preferences?.quote,
      ),
      sheetOptimizer: clampSheetOptimizerSettings(
        project.preferences?.sheetOptimizer ??
          defaultCabinetProject.preferences?.sheetOptimizer,
      ),
      standards: clampProjectStandards(
        project.preferences?.standards ?? defaultCabinetProject.preferences?.standards,
      ),
      drafting: clampDraftingDisplay(
        project.preferences?.drafting ?? defaultCabinetProject.preferences?.drafting,
      ),
    },
    drafting: clampProjectDrafting(project.drafting ?? defaultCabinetProject.drafting),
    quoteHistory: clampQuoteHistory(project.quoteHistory ?? defaultCabinetProject.quoteHistory),
    reviewNotes: clampReviewNotes(project.reviewNotes ?? defaultCabinetProject.reviewNotes),
    revisionHistory: clampRevisionHistory(
      project.revisionHistory ?? defaultCabinetProject.revisionHistory,
    ),
    job: clampJobMeta(project.job ?? defaultCabinetProject.job),
    sheetSet: clampProjectSheetSet(
      project.sheetSet,
      project.sheetSet?.activeSheetId ?? "plan",
    ),
    rooms: project.rooms,
    activeRoomId: project.activeRoomId,
    interiorDocument: project.interiorDocument,
    ledgerProjectId: (() => {
      const id = project.ledgerProjectId?.trim();
      return id && id !== "cabinet-project" ? id : undefined;
    })(),
  };
}
