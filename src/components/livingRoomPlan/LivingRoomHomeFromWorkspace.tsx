import { LivingRoomProjectHome } from "../LivingRoomProjectHome";
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
  return (
    <LivingRoomProjectHome
      open={open}
      hasCurrentProject={hasCurrentProject}
      isDirty={workspace.isDirty}
      recentProjects={workspace.recentProjects}
      recovery={workspace.recovery}
      onClose={workspace.onCloseProjectHome}
      onCreate={(options) => workspace.onCreateStarter(options)}
      onOpenDemo={workspace.onOpenDemo}
      onOpenPhase1Benchmark={workspace.onOpenPhase1Benchmark}
      onOpenRecent={(projectId) => {
        workspace.onOpenRecentProject(projectId);
        if (hasCurrentProject) workspace.onCloseProjectHome();
      }}
      onDeleteRecent={workspace.onDeleteRecentProject}
      onRestoreRecovery={workspace.onRestoreRecovery}
      onDiscardRecovery={workspace.onDiscardRecovery}
    />
  );
}
