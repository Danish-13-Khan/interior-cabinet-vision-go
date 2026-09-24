import { useMemo, useRef, useState } from "react";
import { interiorsRecentProjectCard, type InteriorsUiMode } from "../../domain/desktopUx";
import { filterProjectCards, type ProjectDashboardLayout } from "../../domain/studio/projectDashboard";
import { createLivingRoomPlanThumbnail, type LivingRoomStyleId } from "../../domain/livingRoom";
import { useDialogFocusTrap } from "../../hooks/useDialogFocusTrap";
import { InteriorsCompactProjectsHome, type ProjectFilter } from "./InteriorsCompactProjectsHome";
import { StudioProjectsLanding } from "../studio/StudioProjectsLanding";
import { readProposalCommercial } from "../../domain/livingRoom/proposal/commercialState";
import { formatQuoteMoney } from "../../domain/quoteSettings";
import type { LivingRoomPlanWorkspaceProps, PlannerStarterTemplate } from "./workspaceProps";

type PlannerV2ProjectHomeProps = {
  workspace: LivingRoomPlanWorkspaceProps;
  open: boolean;
  hasCurrentProject: boolean;
  uiMode: InteriorsUiMode;
};

export function PlannerV2ProjectHome({
  workspace,
  open,
  hasCurrentProject,
  uiMode,
}: PlannerV2ProjectHomeProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [projectName, setProjectName] = useState("New cabinet job");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [layout, setLayout] = useState<ProjectDashboardLayout>("grid");
  const recentRows = useMemo(() => workspace.recentProjects.flatMap((entry) => {
    const card = interiorsRecentProjectCard(entry);
    const document = entry.project.interiorDocument;
    if (!card || !document) return [];
    const commercial = readProposalCommercial(document);
    const issued = commercial.quoteHistory[0]?.sellTotal;
    return [{
      ...card,
      thumbnail: entry.thumbnail || createLivingRoomPlanThumbnail(document),
      clientName: commercial.job.customerName,
      sellLabel: issued ? formatQuoteMoney(issued, commercial.quote.currencyLabel) : undefined,
      roomCount: document.rooms.length,
      cabinetCount: document.objects.filter((item) => item.kind === "cabinet").length,
    }];
  }).slice(0, 8), [workspace.recentProjects]);
  const filteredRows = useMemo(
    () => filterProjectCards(recentRows, query, filter),
    [filter, query, recentRows],
  );

  useDialogFocusTrap(
    open,
    dialogRef,
    hasCurrentProject ? workspace.onCloseProjectHome : undefined,
    hasCurrentProject ? "interiors-project-crumb" : null,
  );

  if (!open) return null;

  function createProject(template: PlannerStarterTemplate = "blank-room", styleId: LivingRoomStyleId = "warm-contemporary") {
    const name = projectName.trim();
    if (!name) return;
    workspace.onDiscardRecovery();
    workspace.onCreateStarter({ projectName: name, styleId, template });
  }

  function createFromCatalogTemplate(catalogTemplateId: string) {
    workspace.onDiscardRecovery();
    const name = projectName.trim();
    workspace.onCreateStarter({
      // Blank or placeholder names fall through to the catalog template's own name.
      projectName: name && name !== "New cabinet job" ? name : undefined,
      catalogTemplateId,
    });
  }

  function openPhase1(benchmarkId: Parameters<LivingRoomPlanWorkspaceProps["onOpenPhase1Benchmark"]>[0]) {
    workspace.onDiscardRecovery();
    workspace.onOpenPhase1Benchmark(benchmarkId);
  }

  return (
    <section
      ref={dialogRef}
      className={`planner-v2-home interiors-projects-home studio-landing-shell is-${uiMode}`}
      role="dialog"
      aria-modal="true"
      aria-label="Start a living room project"
      data-testid="interiors-projects-home"
      tabIndex={-1}
    >
      {uiMode === "calm" ? (
        <StudioProjectsLanding
          rows={recentRows}
          filtered={filteredRows}
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
          layout={layout}
          onLayout={setLayout}
          projectName={projectName}
          onProjectName={setProjectName}
          onCreate={() => createProject()}
          onOpenFile={workspace.onOpenProject}
          onOpenProject={workspace.onOpenRecentProject}
          onOpenSample={() => workspace.onOpenGoldenRun()}
          onCreateTemplate={createFromCatalogTemplate}
          recoveryName={workspace.recovery?.project.name ?? null}
          onRestore={workspace.onRestoreRecovery}
          onDiscard={workspace.onDiscardRecovery}
          hasCurrentProject={hasCurrentProject}
          onReturn={workspace.onCloseProjectHome}
        />
      ) : (
        <InteriorsCompactProjectsHome
          workspace={workspace}
          hasCurrentProject={hasCurrentProject}
          projectName={projectName}
          onProjectName={setProjectName}
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
          recentRows={recentRows}
          filteredRows={filteredRows}
          layout={layout}
          onLayout={setLayout}
          onCreateProject={createProject}
          onCreateCatalogTemplate={createFromCatalogTemplate}
          onOpenPhase1={openPhase1}
        />
      )}
    </section>
  );
}
