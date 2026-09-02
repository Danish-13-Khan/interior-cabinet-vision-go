import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import {
  cabinetRunForObject,
  cabinetRunLengthMm,
  countCabinetRunFillers,
  isCabinetRunFiller,
} from "../../domain/livingRoom";
import { interiorsCabinetRunSnapTarget } from "../../domain/desktopUx";
import type { InteriorsCabinetRunCommands } from "./interiorsCabinetRunCommands";

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
  return {
    wallId: snap.wallId,
    snapWarning: snap.warning,
    selectedCount: selected.length,
    selectedRunId: run?.runId ?? null,
    fillerCount: run ? countCabinetRunFillers(props.project, run.runId) : 0,
    fillersEnabled: Boolean(run?.fillersEnabled),
    runLengthMm: run ? cabinetRunLengthMm(props.project, run.runId) : null,
    onCreateRun: () => {
      if (snap.wallId) props.workspace.onCreateCabinetRun(snap.wallId);
    },
    onUpdateRun: props.workspace.onUpdateCabinetRun,
  };
}
