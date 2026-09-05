import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import {
  cabinetRunForObject,
  cabinetRunLengthMm,
  completeCabinetRun,
  countCabinetRunFillers,
  isCabinetRunFiller,
  previewCabinetRunPlacement,
  proposeCabinetRunComplete,
  readPlanMarksSettings,
  setPlanMarksSettings,
} from "../../domain/livingRoom";
import { interiorsCabinetRunSnapTarget } from "../../domain/desktopUx";
import type { InteriorsCabinetRunCommands } from "./interiorsCabinetRunCommands";
import { toggleSiteMeasureChecklistItem, type SiteMeasureUserKey } from "../../domain/livingRoom";

export function inspectPlanTarget(
  props: LivingRoomPlanWorkspaceBodyProps,
  target: {
    wallId?: string | null;
    openingId?: string | null;
    surfaceId?: string | null;
    inspectRoom?: boolean;
    objectId?: string | null;
    additive?: boolean;
  } = {},
) {
  props.setActiveWallId(target.wallId ?? null);
  props.setActiveOpeningId(target.openingId ?? null);
  props.setActiveSurfaceId(target.surfaceId ?? null);
  props.setInspectRoom(Boolean(target.inspectRoom));
  props.workspace.onSelect(target.objectId ?? null, target.additive);
}

export function interiorsDrawRoomStageCommands(props: LivingRoomPlanWorkspaceBodyProps) {
  const { workspace: w } = props;
  return {
    onBuildTool: props.onBuildTool,
    underlay: props.underlay,
    importError: props.importError,
    onSetPlanUnderlay: w.onSetPlanUnderlay,
    onReplaceUnderlay: () => props.underlayPickerRef.current?.(),
    onToggleSiteMeasure: (key: SiteMeasureUserKey, value: boolean) => {
      w.onPatchDocument(
        (current) => toggleSiteMeasureChecklistItem(current, key, value),
        "Updated site measure checklist.",
      );
    },
    onActiveRoom: (roomId: string) => {
      w.onActiveRoom(roomId);
      inspectPlanTarget(props, { inspectRoom: true });
    },
    onRenameRoom: w.onRenameRoom,
    onDeleteRoom: w.onDeleteRoom,
    onMergeRooms: w.onMergeRooms,
  };
}

export function interiorsCabinetRunStageCommands(props: LivingRoomPlanWorkspaceBodyProps): InteriorsCabinetRunCommands {
  const selected = props.workspace.selectedObjects.filter((object) => (
    object.kind === "cabinet" && !isCabinetRunFiller(object)
  ));
  const run = selected.map(cabinetRunForObject).find((item) => item) ?? null;
  const snap = interiorsCabinetRunSnapTarget(selected);
  const wallId = snap.wallId ?? run?.wallId ?? props.activeWallId ?? null;
  const preview = wallId
    ? previewCabinetRunPlacement(props.project, wallId, { runId: run?.runId, roomId: props.project.activeRoomId })
    : null;
  const complete = run ? proposeCabinetRunComplete(props.project, run.runId) : null;
  const planMarks = readPlanMarksSettings(props.project);
  return {
    wallId,
    snapWarning: snap.warning,
    selectedCount: selected.length,
    selectedRunId: run?.runId ?? null,
    fillerCount: run ? countCabinetRunFillers(props.project, run.runId) : 0,
    fillersEnabled: Boolean(run?.fillersEnabled),
    runLengthMm: run ? cabinetRunLengthMm(props.project, run.runId) : null,
    remainingMm: preview?.remainingMm ?? null,
    completeSummary: complete?.summary ?? null,
    leftoverMessage: complete && complete.leftoverGapsMm.length
      ? `Leftover ${complete.leftoverGapsMm.join(", ")} mm outside filler range`
      : null,
    planMarksEnabled: planMarks.enabled,
    onCreateRun: () => {
      if (snap.wallId) props.workspace.onCreateCabinetRun(snap.wallId);
    },
    onUpdateRun: props.workspace.onUpdateCabinetRun,
    onCompleteRun: (runId) => {
      props.workspace.onPatchDocument((current) => {
        const result = completeCabinetRun(current, runId);
        return result?.project ?? current;
      }, "Completed cabinet run.");
    },
    onTogglePlanMarks: (enabled) => {
      props.workspace.onPatchDocument(
        (current) => setPlanMarksSettings(current, { enabled }),
        enabled ? "Showed plan marks." : "Hid plan marks.",
      );
    },
  };
}
