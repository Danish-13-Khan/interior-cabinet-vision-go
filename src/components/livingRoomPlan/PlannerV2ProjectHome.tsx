import { useEffect, useMemo, useRef, useState } from "react";
import { interiorsRecentProjectCard } from "../../domain/desktopUx";
import { createLivingRoomPlanThumbnail, type LivingRoomStyleId } from "../../domain/livingRoom";
import { useDialogFocusTrap } from "../../hooks/useDialogFocusTrap";
import { InteriorsApartmentTemplates } from "./InteriorsApartmentTemplates";
import { InteriorsPopularTemplates } from "./InteriorsPopularTemplates";
import { takePendingTemplate } from "../../domain/apartmentTemplates/pendingTemplateHandoff";
import { lookupApartmentTemplate } from "../../domain/apartmentTemplates";
import { lookupBuiltInCatalogTemplate } from "../../domain/catalog";
import { InteriorsProjectsIntro } from "./InteriorsProjectsIntro";
import { InteriorsProjectsPhase1Qa } from "./InteriorsProjectsPhase1Qa";
import { InteriorsProjectsRecents } from "./InteriorsProjectsRecents";
import { InteriorsProjectsStarters } from "./InteriorsProjectsStarters";
import type { LivingRoomPlanWorkspaceProps, PlannerStarterTemplate } from "./workspaceProps";
import { browserLoading, recoveryOffer } from "../../domain/projectDrafts/browserSignals";

type PlannerV2ProjectHomeProps = {
  workspace: LivingRoomPlanWorkspaceProps;
  open: boolean;
  hasCurrentProject: boolean;
};

export function PlannerV2ProjectHome({
  workspace,
  open,
  hasCurrentProject,
}: PlannerV2ProjectHomeProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [projectName, setProjectName] = useState("New cabinet job");
  const [projectsLoading, setProjectsLoading] = useState(browserLoading.get());
  const [recoveryPrompt, setRecoveryPrompt] = useState<string | null>(recoveryOffer.get()?.prompt ?? null);
  useEffect(() => browserLoading.subscribe(setProjectsLoading), []);
  useEffect(() => recoveryOffer.subscribe((offer) => setRecoveryPrompt(offer?.prompt ?? null)), []);
  const recentRows = useMemo(() => workspace.recentProjects.flatMap((entry) => {
    const card = interiorsRecentProjectCard(entry);
    const document = entry.project.interiorDocument;
    if (!card || !document) return [];
    return [{ ...card, thumbnail: entry.thumbnail || createLivingRoomPlanThumbnail(document) }];
  }).slice(0, 8), [workspace.recentProjects]);

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

  function createFromApartmentTemplate(apartmentTemplateId: string) {
    workspace.onDiscardRecovery();
    const name = projectName.trim();
    workspace.onCreateStarter({
      projectName: name && name !== "New cabinet job" ? name : undefined,
      apartmentTemplateId,
    });
  }

  useEffect(() => {
    const pending = takePendingTemplate();
    if (!pending) return;
    if (lookupApartmentTemplate(pending)) createFromApartmentTemplate(pending);
    else if (lookupBuiltInCatalogTemplate(pending)) createFromCatalogTemplate(pending);
  }, []);

  function openPhase1(benchmarkId: Parameters<LivingRoomPlanWorkspaceProps["onOpenPhase1Benchmark"]>[0]) {
    workspace.onDiscardRecovery();
    workspace.onOpenPhase1Benchmark(benchmarkId);
  }

  return (
    <section
      ref={dialogRef}
      className="planner-v2-home interiors-projects-home"
      role="dialog"
      aria-modal="true"
      aria-label="Start a living room project"
      data-testid="interiors-projects-home"
      data-autosave-state={workspace.autosaveState}
      tabIndex={-1}
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
          <section className="planner-v2-recovery" data-testid="interiors-recovery">
            <div><span>{recoveryPrompt ?? "Restore unsaved changes?"}</span><strong>{workspace.recovery.project.name}</strong></div>
            <button type="button" className="is-primary" data-testid="interiors-recovery-restore" onClick={workspace.onRestoreRecovery}>Restore</button>
            <button type="button" data-testid="interiors-recovery-discard" onClick={workspace.onDiscardRecovery}>Discard</button>
          </section>
        ) : null}
        {projectsLoading ? <p data-testid="projects-loading">Loading projects…</p> : null}
        <InteriorsProjectsRecents rows={recentRows} onOpen={workspace.onOpenRecentProject} />
        <InteriorsApartmentTemplates onCreate={createFromApartmentTemplate} />
        <InteriorsPopularTemplates onCreate={createFromCatalogTemplate} />
        {import.meta.env.DEV ? (
          <details className="interiors-template-drawer interiors-dev-qa">
            <summary>Developer · Phase 1 QA</summary>
            <InteriorsProjectsPhase1Qa onOpen={openPhase1} />
          </details>
        ) : null}
        <details className="interiors-template-drawer">
          <summary>More room starters</summary>
          <InteriorsProjectsStarters onCreate={createProject} />
        </details>
      </div>
    </section>
  );
}
