import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";

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
  const { workspace: w, project, build } = props;
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
