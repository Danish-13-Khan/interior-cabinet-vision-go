import { useState } from "react";
import { readProposalCommercial } from "../../domain/livingRoom";
import { interiorsJobStatusLabel, interiorsWorkflowSteps } from "../../domain/desktopUx";
import type { useInteriorsWorkspaceChrome } from "../../hooks/useInteriorsWorkspaceChrome";
import { InteriorsWorkspaceHeader } from "./InteriorsWorkspaceHeader";
import { InteriorsWorkflowNav } from "./InteriorsWorkflowNav";
import { InteriorProjectToolsLauncher } from "./InteriorProjectToolsLauncher";
import type { LivingRoomPlanWorkspaceProps } from "./workspaceProps";

type LivingRoomWorkspaceTopBarProps = {
  workspace: LivingRoomPlanWorkspaceProps;
  chrome: ReturnType<typeof useInteriorsWorkspaceChrome>;
  roomName: string;
};

/** Wires the single top bar: job facts → numbered steps, job menu → project tools. */
export function LivingRoomWorkspaceTopBar({ workspace: props, chrome, roomName }: LivingRoomWorkspaceTopBarProps) {
  const [toolsSignal, setToolsSignal] = useState(0);
  const project = props.project;
  const projectHome = props.projectHomeOpen || !project;
  const job = project ? readProposalCommercial(project).job : null;
  const cabinetCount = project?.objects.filter((item) => item.kind === "cabinet").length ?? 0;
  const steps = project ? interiorsWorkflowSteps({
    area: chrome.workflowArea,
    wallCount: project.walls.length,
    cabinetCount,
    materialCount: project.materials.length,
    blockingIssueCount: props.issues.filter((issue) => issue.severity === "error").length,
    jobStatus: job?.status ?? "draft",
  }) : [];

  return (
    <InteriorsWorkspaceHeader
      tools={project && !projectHome ? (
        <InteriorProjectToolsLauncher
          project={project}
          openSignal={toolsSignal}
          onPatchDocument={(update) => props.onPatchDocument(update, "Project details updated")}
        />
      ) : null}
      steps={<InteriorsWorkflowNav steps={steps} onArea={chrome.setWorkflowArea} />}
      projectName={project?.name ?? null}
      projectId={project?.id ?? null}
      roomName={roomName}
      revision={job?.revision ?? "A"}
      statusLabel={interiorsJobStatusLabel(job?.status ?? "draft", cabinetCount > 0)}
      workspaceView={chrome.workspaceView}
      isDirty={props.isDirty}
      autosaveState={props.autosaveState}
      lastAutosavedAt={props.lastAutosavedAt}
      canUndo={props.canUndo}
      canRedo={props.canRedo}
      presenting={chrome.plannerMode === "render"}
      projectHome={projectHome}
      onProject={() => chrome.changePlannerMode("project")}
      onProjectTools={() => setToolsSignal((count) => count + 1)}
      onOpen={props.onOpenProject}
      onExport={props.onExportProject}
      onView={chrome.changeWorkspaceView}
      onSave={props.onSaveProject}
      onUndo={props.onUndo}
      onRedo={props.onRedo}
      onPresent={chrome.present}
      onOpenShortcuts={props.onOpenShortcuts}
    />
  );
}
