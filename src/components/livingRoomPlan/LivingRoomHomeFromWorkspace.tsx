import { PlannerV2ProjectHome } from "./PlannerV2ProjectHome";
import type { LivingRoomPlanWorkspaceProps } from "./workspaceProps";
import type { InteriorsUiMode } from "../../domain/desktopUx";

export function LivingRoomHomeFromWorkspace({
  workspace,
  open,
  hasCurrentProject,
  uiMode,
}: {
  workspace: LivingRoomPlanWorkspaceProps;
  open: boolean;
  hasCurrentProject: boolean;
  uiMode: InteriorsUiMode;
}) {
  return (
    <PlannerV2ProjectHome
      workspace={workspace} open={open} hasCurrentProject={hasCurrentProject}
      uiMode={uiMode}
    />
  );
}
