import { useMemo, useState } from "react";
import { interiorsRecentProjectCard } from "../../domain/desktopUx";
import { createLivingRoomPlanThumbnail, type LivingRoomStyleId } from "../../domain/livingRoom";
import { InteriorsProjectsIntro } from "./InteriorsProjectsIntro";
import { InteriorsProjectsRecents } from "./InteriorsProjectsRecents";
import { InteriorsProjectsStarters } from "./InteriorsProjectsStarters";
import type { LivingRoomPlanWorkspaceProps, PlannerStarterTemplate } from "./workspaceProps";

type PlannerV2ProjectHomeProps = {
  workspace: LivingRoomPlanWorkspaceProps;
  open: boolean;
  hasCurrentProject: boolean;
};

export function PlannerV2ProjectHome({ workspace, open, hasCurrentProject }: PlannerV2ProjectHomeProps) {
  const [projectName, setProjectName] = useState("New cabinet job");
  const recentRows = useMemo(() => workspace.recentProjects.flatMap((entry) => {
    const card = interiorsRecentProjectCard(entry);
    const document = entry.project.interiorDocument;
    if (!card || !document) return [];
    return [{ ...card, thumbnail: entry.thumbnail || createLivingRoomPlanThumbnail(document) }];
  }).slice(0, 8), [workspace.recentProjects]);
  if (!open) return null;

  function createProject(template: PlannerStarterTemplate = "blank-room", styleId: LivingRoomStyleId = "warm-contemporary") {
    const name = projectName.trim();
    if (!name) return;
    workspace.onDiscardRecovery();
    workspace.onCreateStarter({ projectName: name, styleId, template });
  }

  return (
    <section
      className="planner-v2-home interiors-projects-home"
      role="dialog"
      aria-modal="true"
      aria-label="Start a living room project"
      data-testid="interiors-projects-home"
    >
      <InteriorsProjectsIntro
        projectName={projectName}
        hasCurrentProject={hasCurrentProject}
        onProjectName={setProjectName}
        onCreate={() => createProject()}
        onOpen={workspace.onOpenProject}
        onReturn={workspace.onCloseProjectHome}
      />
      <div className="planner-v2-home-content">
        {workspace.recovery ? (
          <section className="planner-v2-recovery">
            <div><span>Autosave available</span><strong>{workspace.recovery.project.name}</strong></div>
            <button type="button" className="is-primary" onClick={workspace.onRestoreRecovery}>Restore</button>
            <button type="button" onClick={workspace.onDiscardRecovery}>Discard</button>
          </section>
        ) : null}
        <InteriorsProjectsRecents rows={recentRows} onOpen={workspace.onOpenRecentProject} />
        <InteriorsProjectsStarters onCreate={createProject} />
      </div>
    </section>
  );
}
