import { setWallVisible, showAllWalls } from "../domain/livingRoom";
import { nextSelectableObjectId } from "../domain/livingRoom/objectSelection";
import { useLivingRoomPlanHotkeys } from "../hooks/useLivingRoomPlanHotkeys";
import type { InteriorProject } from "../domain/interiorProject";
import type { LivingRoomWorkspaceView } from "../components/livingRoomPlan/workspaceProps";

/** Plan/model authoring hotkeys for the Interiors workspace shell. */
export function useLivingRoomPlanWorkspaceHotkeys(options: {
  project: InteriorProject | null;
  projectHomeOpen: boolean;
  snapSizeMm: number;
  workspaceView: LivingRoomWorkspaceView;
  canUndo: boolean;
  canRedo: boolean;
  selectedIds: string[];
  activeWallId: string | null;
  onView: (view: LivingRoomWorkspaceView) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRotateSelection: (delta: number) => void;
  onNudge: (dx: number, dz: number) => void;
  onSelect: (objectId: string | null) => void;
  onClearArchitecture: () => void;
  onCancelTool: () => void;
  onMeasureTool: () => void;
  onOpenMaterial: () => void;
  onFitPlan: () => void;
  onFitSelection: () => void;
  onPatchDocument: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
}) {
  const wallId = options.activeWallId;
  useLivingRoomPlanHotkeys({
    projectHomeOpen: options.projectHomeOpen,
    snapSizeMm: options.snapSizeMm,
    workspaceView: options.workspaceView,
    canUndo: options.canUndo,
    canRedo: options.canRedo,
    onView: options.onView,
    onUndo: options.onUndo,
    onRedo: options.onRedo,
    onDuplicate: options.onDuplicate,
    onDelete: options.onDelete,
    onRotateSelection: options.onRotateSelection,
    onNudge: options.onNudge,
    onClearSelection: options.onClearArchitecture,
    onCancelTool: options.onCancelTool,
    onMeasureTool: options.onMeasureTool,
    onOpenMaterial: options.onOpenMaterial,
    onFitPlan: options.onFitPlan,
    onFitSelection: options.onFitSelection,
    onHideSelectedWall: wallId
      ? () => {
          options.onPatchDocument(
            (current) => setWallVisible(current, wallId, false),
            "Hide wall",
          );
          options.onClearArchitecture();
        }
      : undefined,
    onShowAllWalls: () => {
      options.onPatchDocument((current) => showAllWalls(current), "Show all walls");
    },
    onCycleSelection: (delta) => {
      if (!options.project) return;
      const next = nextSelectableObjectId(
        options.project.objects,
        options.selectedIds[0] ?? null,
        delta,
        options.project.activeRoomId,
      );
      if (next) options.onSelect(next);
    },
  });
}
