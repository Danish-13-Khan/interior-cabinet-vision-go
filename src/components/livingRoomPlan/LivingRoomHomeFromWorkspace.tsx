import { PlannerV2ProjectHome } from "./PlannerV2ProjectHome";
import type { LivingRoomPlanWorkspaceProps } from "./workspaceProps";

export function LivingRoomHomeFromWorkspace({
  workspace,
  open,
  hasCurrentProject,
}: {
  workspace: LivingRoomPlanWorkspaceProps;
  open: boolean;
  hasCurrentProject: boolean;
}) {
  return <PlannerV2ProjectHome workspace={workspace} open={open} hasCurrentProject={hasCurrentProject} />;
}
