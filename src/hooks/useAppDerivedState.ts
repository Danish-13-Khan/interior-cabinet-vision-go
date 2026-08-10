import { useMemo } from "react";
import {
  CABINET_GRID_SNAP_MM,
  clampCabinetConfig,
  defaultCabinetProject,
  getCabinetValidationMessages,
  type CabinetInstance,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import {
  createCabinetDerivedMetrics,
} from "../domain/cabinetGeometry";
import type { RoomConfig } from "../domain/roomModel";
import { createCabinetConstruction } from "../domain/cabinetConstruction";
import { createCabinetPlanningWorkflow } from "../domain/cabinetLibrary";
import { createProjectReport } from "../domain/projectReport";
import { createMachineJobDocument } from "../domain/machineExport";
import {
  createWholeProjectReport,
  listProjectRooms,
} from "../domain/projectRooms";
import {
  evaluateCabinetRules,
  type ManufacturingIssue,
} from "../domain/manufacturingRules";
import {
  createCabinetProductionCutlist,
  createProjectProductionCutlist,
} from "../domain/productionCutlist";
import {
  clampCostingSettings,
  DEFAULT_COSTING_SETTINGS,
} from "../domain/costingSettings";
import {
  clampQuoteSettings,
  DEFAULT_QUOTE_SETTINGS,
} from "../domain/quoteSettings";
import {
  canApproveForRelease,
  canReleaseForProduction,
} from "../domain/projectReview";
import {
  clampSheetOptimizerSettings,
  DEFAULT_SHEET_OPTIMIZER,
} from "../domain/sheetStock";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
} from "../domain/projectStandards";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
  DEFAULT_DRAFTING,
  DEFAULT_DRAFTING_DISPLAY,
} from "../domain/draftingAnnotations";
import { createDefaultLayer } from "../domain/editorSnapshot";

type UseAppDerivedStateArgs = {
  project: CabinetProject;
  room: RoomConfig;
  activeCabinetId: string | null;
  selectedCabinetIds: string[];
};

export function useAppDerivedState({
  project,
  room,
  activeCabinetId,
  selectedCabinetIds,
}: UseAppDerivedStateArgs) {
  const selectedCabinet =
    project.cabinets.find((cabinet) => cabinet.id === activeCabinetId) ?? null;
  const selectedCabinets = useMemo(
    () => project.cabinets.filter((cabinet) => selectedCabinetIds.includes(cabinet.id)),
    [project.cabinets, selectedCabinetIds],
  );
  const selectedConfig = selectedCabinet?.config ?? defaultCabinetProject.cabinets[0].config;
  const selectedPlacement =
    selectedCabinet?.placement ?? defaultCabinetProject.cabinets[0].placement;
  const selectedLayerId = selectedCabinet?.layerId ?? project.layers?.[0]?.id ?? "layer-default";
  const selectedGroupId = selectedCabinet?.groupId ?? null;
  const projectPreferences =
    project.preferences ?? defaultCabinetProject.preferences ?? {
      snapSizeMm: CABINET_GRID_SNAP_MM,
      showGrid: true,
      autoSaveToBrowser: true,
      costing: DEFAULT_COSTING_SETTINGS,
      quote: DEFAULT_QUOTE_SETTINGS,
      sheetOptimizer: DEFAULT_SHEET_OPTIMIZER,
      standards: DEFAULT_PROJECT_STANDARDS,
      drafting: DEFAULT_DRAFTING_DISPLAY,
    };
  const costingSettings = clampCostingSettings(projectPreferences.costing);
  const quoteSettings = clampQuoteSettings(projectPreferences.quote);
  const sheetOptimizerSettings = clampSheetOptimizerSettings(
    projectPreferences.sheetOptimizer,
  );
  const projectStandards = clampProjectStandards(projectPreferences.standards);
  const draftingDisplay = clampDraftingDisplay(projectPreferences.drafting);
  const projectDrafting = clampProjectDrafting(project.drafting ?? DEFAULT_DRAFTING);
  const layers = project.layers ?? [createDefaultLayer()];
  const groups = project.groups ?? [];
  const validationMessages = useMemo(
    () =>
      getCabinetValidationMessages(
        selectedConfig,
        selectedCabinet?.placement ?? null,
        room.dimensions.heightMm,
      ),
    [room.dimensions.heightMm, selectedCabinet?.placement, selectedConfig],
  );
  const manufacturingIssues = useMemo((): ManufacturingIssue[] => {
    if (!selectedCabinet) return [];
    const safeConfig = clampCabinetConfig(selectedCabinet.config);
    return evaluateCabinetRules(safeConfig, {
      placement: selectedCabinet.placement,
      roomHeightMm: room.dimensions.heightMm,
    }).filter((issue) => issue.severity === "error" || issue.severity === "warning");
  }, [room.dimensions.heightMm, selectedCabinet]);  const cutlistItems = useMemo(() => createProjectProductionCutlist(project), [project]);
  const cabinetCutlistItems = useMemo(
    () => (selectedCabinet ? createCabinetProductionCutlist(selectedCabinet) : []),
    [selectedCabinet],
  );
  const derivedMetrics = useMemo(
    () =>
      selectedCabinet
        ? createCabinetDerivedMetrics(selectedCabinet.config)
        : createCabinetDerivedMetrics(defaultCabinetProject.cabinets[0].config),
    [selectedCabinet],
  );
  const selectedConstruction = useMemo(
    () => (selectedCabinet ? createCabinetConstruction(selectedCabinet.config) : null),
    [selectedCabinet],
  );
  const roomBounds = useMemo(
    () => ({
      widthMm: room.dimensions.widthMm,
      depthMm: room.dimensions.depthMm,
      heightMm: room.dimensions.heightMm,
    }),
    [room.dimensions.depthMm, room.dimensions.heightMm, room.dimensions.widthMm],
  );
  const planningWorkflow = useMemo(
    () => createCabinetPlanningWorkflow(project, roomBounds),
    [project, roomBounds],
  );
  const projectReport = useMemo(
    () => createProjectReport(project, room, planningWorkflow),
    [planningWorkflow, project, room],
  );
  const wholeProjectReport = useMemo(
    () => createWholeProjectReport(project),
    [project],
  );
  const machineJobDocument = useMemo(
    () => createMachineJobDocument(project, cutlistItems),
    [cutlistItems, project],
  );
  const projectRooms = useMemo(() => listProjectRooms(project), [project]);
  const approvalGate = useMemo(() => canApproveForRelease(project), [project]);
  const releaseGate = useMemo(() => canReleaseForProduction(project), [project]);

  return {
    selectedCabinet: selectedCabinet as CabinetInstance | null,
    selectedCabinets,
    selectedConfig,
    selectedPlacement,
    selectedLayerId,
    selectedGroupId,
    projectPreferences,
    costingSettings,
    quoteSettings,
    sheetOptimizerSettings,
    projectStandards,
    draftingDisplay,
    projectDrafting,
    layers,
    groups,
    validationMessages,
    manufacturingIssues,
    cutlistItems,
    cabinetCutlistItems,
    derivedMetrics,
    selectedConstruction,
    roomBounds,
    planningWorkflow,
    projectReport,
    wholeProjectReport,
    machineJobDocument,
    projectRooms,
    approvalGate,
    releaseGate,
  };
}
