import {
  defaultCabinetProject,
} from "../domain/cabinetDimensions";
import {
  getActiveProjectRoom,
} from "../domain/projectRooms";
import {
  formatShortcutBinding,
  upsertRecentCommandId,
} from "../domain/desktopUx";
import { useProjectFileIo } from "./useProjectFileIo";
import { useRoomProjectOps } from "./useRoomProjectOps";
import { useReviewWorkflow } from "./useReviewWorkflow";
import { useProjectPreferences } from "./useProjectPreferences";
import { useAppControllerChrome } from "./useAppControllerChrome";
import { useDirtyWindowTitle } from "./useDirtyWindowTitle";
import { useAppControllerCabinets } from "./useAppControllerCabinets";
import { useAppControllerSession } from "./useAppControllerSession";
import { useSceneTreeOps } from "./useSceneTreeOps";
import { useSheetDocumentOps } from "./useSheetDocumentOps";
import type { DrawingSheetId } from "../domain/drawingSheets";
import { useLivingRoomPlanEditor } from "./useLivingRoomPlanEditor";
import { useLivingRoomRecovery } from "./useLivingRoomRecovery";

export function useAppController() {
  const s = useAppControllerSession();

  const fileIo = useProjectFileIo({
    project: s.project,
    room: s.room,
    projectFilePath: s.projectFilePath,
    setProjectFilePath: s.setProjectFilePath,
    planningWorkflow: s.planningWorkflow,
    applySnapshot: s.applySnapshot,
    onStatus: s.setProjectStatus,
    rememberFile: s.rememberFile,
    forgetFile: s.forgetFile,
    saveCurrentProjectToBrowser: s.saveCurrentProjectToBrowser,
    captureThumbnail: () => s.sceneRef.current?.captureThumbnail() ?? "",
    initialSession: s.initialSession,
  });

  const rooms = useRoomProjectOps({
    project: s.project,
    room: s.room,
    commitProjectChange: s.commitProjectChange,
    commitSnapshot: s.commitSnapshot,
    onStatus: s.setProjectStatus,
  });

  const cabinets = useAppControllerCabinets({
    project: s.project,
    room: s.room,
    roomBounds: s.roomBounds,
    activeCabinetId: s.activeCabinetId,
    activeOpeningId: s.activeOpeningId,
    selectedCabinet: s.selectedCabinet,
    selectedCabinets: s.selectedCabinets,
    selectedCabinetIds: s.selectedCabinetIds,
    layers: s.layers,
    groups: s.groups,
    projectPreferences: s.projectPreferences,
    projectStandards: s.projectStandards,
    workshopCabinetPresets: s.workshopLibrary.cabinetPresets,
    userTemplates: s.userTemplates,
    clipboardRef: s.clipboardRef,
    commitProjectChange: s.commitProjectChange,
    commitSnapshot: s.commitSnapshot,
    replaceSelection: s.replaceSelection,
    setActiveOpeningId: s.setActiveOpeningId,
    isCabinetLocked: s.isCabinetLocked,
    setProjectFilePath: s.setProjectFilePath,
    saveTemplate: s.saveTemplate,
    deleteTemplate: s.deleteTemplate,
    onStatus: s.setProjectStatus,
  });

  const sceneTree = useSceneTreeOps({
    project: s.project,
    roomBounds: s.roomBounds,
    activeRoomId: s.project.activeRoomId ?? null,
    runs: s.planningWorkflow.runs,
    selectedCabinetIds: s.selectedCabinetIds,
    isolatedCabinetIds: s.isolatedCabinetIds,
    setIsolatedCabinetIds: s.setIsolatedCabinetIds,
    commitProjectChange: s.commitProjectChange,
    replaceSelection: s.replaceSelection,
    selectCabinetsInRoom: rooms.handleSelectCabinetsInRoom,
    fitView: () => s.sceneRef.current?.fitView(),
    onStatus: s.setProjectStatus,
  });

  const sheets = useSheetDocumentOps({
    commitProjectChange: s.commitProjectChange,
    onSelectCatalogSheet: (sheetId: DrawingSheetId) => {
      s.setLayout({ activeSheetId: sheetId });
      if (sheetId === "plan" || sheetId === "front" || sheetId === "side") {
        s.setWorkspaceTab(sheetId);
      }
    },
    onStatus: s.setProjectStatus,
  });

  const review = useReviewWorkflow({
    project: s.project,
    projectReport: s.projectReport,
    commitProjectChange: s.commitProjectChange,
    onStatus: s.setProjectStatus,
  });

  const preferences = useProjectPreferences({
    project: s.project,
    commitProjectChange: s.commitProjectChange,
    setDraftingTool: s.setDraftingTool,
    onStatus: s.setProjectStatus,
  });

  const livingRoom = useLivingRoomPlanEditor({
    project: s.project,
    room: s.room,
    commitProjectChange: s.commitProjectChange,
    commitSnapshot: s.commitSnapshot,
    onStatus: s.setProjectStatus,
  });

  const livingRoomRecovery = useLivingRoomRecovery({
    project: livingRoom.livingRoomDocument,
    isDirty: fileIo.isProjectDirty,
    onRestore: livingRoom.restoreLivingRoomDocument,
    onStatus: s.setProjectStatus,
  });

  const { closeCommandSurfaces, commandItems, ...menus } = useAppControllerChrome({
    session: s,
    fileIo,
    cabinets,
    preferences,
    review,
  });

  useDirtyWindowTitle(fileIo.isProjectDirty, s.project.interiorDocument?.name ?? "Interior Cabinet Designer");

  const activeRoomName = getActiveProjectRoom(s.project).name;
  const workspaceLabel =
    s.workspaceTab === "plan"
      ? `${activeRoomName} · Plan`
      : s.workspaceTab === "front"
        ? `${activeRoomName} · Elev.`
        : s.workspaceTab === "side"
          ? `${activeRoomName} · Side`
          : `${activeRoomName} · Model`;

  const tabShortcutHints = {
    plan: formatShortcutBinding(s.shortcutMap.viewPlan),
    front: formatShortcutBinding(s.shortcutMap.viewFront),
    side: formatShortcutBinding(s.shortcutMap.viewSide),
    "3d": formatShortcutBinding(s.shortcutMap.view3d),
  };

  return {
    ...s,
    ...fileIo,
    ...rooms,
    ...cabinets,
    ...sceneTree,
    ...sheets,
    ...review,
    ...preferences,
    ...livingRoom,
    ...livingRoomRecovery,
    ...menus,
    closeCommandSurfaces,
    commandItems,
    workspaceLabel,
    tabShortcutHints,
    upsertRecentCommandId,
    defaultCabinetProject,
  };
}
