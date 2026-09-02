import type { InteriorProject } from "../../domain/interiorProject";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import type { BuildTool } from "../../domain/livingRoom";
import type { InteriorsChromeTool } from "../../domain/desktopUx";

export type InteriorsDrawRoomCommands = {
  onBuildTool: (tool: BuildTool) => void;
  underlay: LivingRoomPlanUnderlay | null;
  importError: string;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onReplaceUnderlay: () => void;
  onActiveRoom?: (roomId: string) => void;
  onRenameRoom?: (roomId: string, name: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onMergeRooms?: (targetRoomId: string, absorbedRoomId: string) => void;
};

export type InteriorsDrawRoomManageProps = {
  project: InteriorProject;
  tool: InteriorsChromeTool;
  activeBuildTool?: BuildTool;
  commands: InteriorsDrawRoomCommands;
};
