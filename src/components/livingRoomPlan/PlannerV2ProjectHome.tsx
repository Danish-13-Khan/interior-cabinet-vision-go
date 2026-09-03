import { useMemo, useRef, useState } from "react";
import { interiorsRecentProjectCard, interiorsUiModeLabel, type InteriorsUiMode } from "../../domain/desktopUx";
import { createLivingRoomPlanThumbnail, type LivingRoomStyleId } from "../../domain/livingRoom";
import { useDialogFocusTrap } from "../../hooks/useDialogFocusTrap";
import { InteriorsProjectsIntro } from "./InteriorsProjectsIntro";
import { InteriorsProjectsPhase1Qa } from "./InteriorsProjectsPhase1Qa";
import { InteriorsProjectsRecents } from "./InteriorsProjectsRecents";
import { InteriorsProjectsStarters } from "./InteriorsProjectsStarters";
import type { LivingRoomPlanWorkspaceProps, PlannerStarterTemplate } from "./workspaceProps";

type PlannerV2ProjectHomeProps = {
  workspace: LivingRoomPlanWorkspaceProps;
  open: boolean;
  hasCurrentProject: boolean;
  uiMode: InteriorsUiMode;
  onUiMode: (mode: InteriorsUiMode) => void;
};

type ProjectFilter = "all" | "design" | "quoted" | "engineering";

export function PlannerV2ProjectHome({
  workspace,
  open,
  hasCurrentProject,
  uiMode,
  onUiMode,
}: PlannerV2ProjectHomeProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [projectName, setProjectName] = useState("New cabinet job");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const recentRows = useMemo(() => workspace.recentProjects.flatMap((entry) => {
    const card = interiorsRecentProjectCard(entry);
    const document = entry.project.interiorDocument;
    if (!card || !document) return [];
    return [{ ...card, thumbnail: entry.thumbnail || createLivingRoomPlanThumbnail(document) }];
  }).slice(0, 8), [workspace.recentProjects]);
  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return recentRows.filter((row) => {
      const matchesQuery = !needle || `${row.name} ${row.kindLabel} ${row.statusLabel}`.toLowerCase().includes(needle);
      const matchesFilter = filter === "all"
        || (filter === "design" && row.statusTone === "design")
        || (filter === "quoted" && row.statusTone === "quoted")
        || (filter === "engineering" && (row.statusTone === "approved" || row.statusTone === "sent"));
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, recentRows]);

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

  function openPhase1(benchmarkId: Parameters<LivingRoomPlanWorkspaceProps["onOpenPhase1Benchmark"]>[0]) {
    workspace.onDiscardRecovery();
    workspace.onOpenPhase1Benchmark(benchmarkId);
  }

  return (
    <section
      ref={dialogRef}
      className={`planner-v2-home interiors-projects-home is-${uiMode}`}
      role="dialog"
      aria-modal="true"
      aria-label="Start a living room project"
      data-testid="interiors-projects-home"
      tabIndex={-1}
    >
      <div className="interiors-mode-menu" data-testid="interiors-ui-mode-menu">
        <span><small>Workspace style</small><strong>{interiorsUiModeLabel(uiMode)}</strong></span>
        <div role="group" aria-label="Workspace style">
          <button
            type="button" className={uiMode === "calm" ? "is-selected" : ""}
            aria-pressed={uiMode === "calm"} data-testid="interiors-mode-calm"
            onClick={() => onUiMode("calm")}
          >
            <strong>Calm guided</strong><small>Labels and full properties</small>
          </button>
          <button
            type="button" className={uiMode === "compact" ? "is-selected" : ""}
            aria-pressed={uiMode === "compact"} data-testid="interiors-mode-compact"
            onClick={() => onUiMode("compact")}
          >
            <strong>Compact pro</strong><small>More canvas, faster scanning</small>
          </button>
        </div>
      </div>

      {uiMode === "calm" ? (
        <>
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
                <div><span>Autosave available</span><strong>{workspace.recovery.project.name}</strong></div>
                <button type="button" className="is-primary" data-testid="interiors-recovery-restore" onClick={workspace.onRestoreRecovery}>Restore</button>
                <button type="button" data-testid="interiors-recovery-discard" onClick={workspace.onDiscardRecovery}>Discard</button>
              </section>
            ) : null}
            <InteriorsProjectsRecents rows={recentRows} onOpen={workspace.onOpenRecentProject} />
            <InteriorsProjectsPhase1Qa onOpen={openPhase1} />
            <details className="interiors-template-drawer" open>
              <summary>Start from a template</summary>
              <InteriorsProjectsStarters onCreate={createProject} />
            </details>
          </div>
        </>
      ) : (
        <div className="interiors-compact-projects">
          <aside className="interiors-project-filters" aria-label="Project filters">
            <span>Workspace</span>
            {([
              ["all", "All jobs"],
              ["design", "In design"],
              ["quoted", "Quoted"],
              ["engineering", "Engineering"],
            ] as Array<[ProjectFilter, string]>).map(([id, label]) => (
              <button key={id} type="button" className={filter === id ? "is-selected" : ""} onClick={() => setFilter(id)}>
                <span>{label}</span><small>{id === "all" ? recentRows.length : recentRows.filter((row) => (
                  id === "design" ? row.statusTone === "design"
                    : id === "quoted" ? row.statusTone === "quoted"
                      : row.statusTone === "approved" || row.statusTone === "sent"
                )).length}</small>
              </button>
            ))}
          </aside>
          <main className="interiors-job-table-wrap">
            <header className="interiors-job-heading">
              <div><span>Active jobs</span><h1>Cabinet jobs</h1></div>
              <label className="interiors-job-search">
                <span>Search jobs</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Project, room or status" />
              </label>
              <label className="interiors-compact-job-name">
                <span>New job name</span>
                <input
                  value={projectName} maxLength={80} data-testid="interiors-job-name"
                  data-dialog-initial-focus
                  onChange={(event) => setProjectName(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") createProject(); }}
                />
              </label>
              <button type="button" onClick={workspace.onOpenProject}>Import</button>
              <button type="button" className="is-primary" data-testid="interiors-new-job" disabled={!projectName.trim()} onClick={() => createProject()}>
                + New job
              </button>
              {hasCurrentProject ? <button type="button" onClick={workspace.onCloseProjectHome}>Return</button> : null}
            </header>
            {workspace.recovery ? (
              <section className="planner-v2-recovery" data-testid="interiors-recovery">
                <div><span>Autosave available</span><strong>{workspace.recovery.project.name}</strong></div>
                <button type="button" className="is-primary" data-testid="interiors-recovery-restore" onClick={workspace.onRestoreRecovery}>Restore</button>
                <button type="button" data-testid="interiors-recovery-discard" onClick={workspace.onDiscardRecovery}>Discard</button>
              </section>
            ) : null}
            <div className="interiors-job-table" role="table" aria-label="Cabinet jobs">
              <div className="interiors-job-table-head" role="row">
                <span>Project</span><span>Room</span><span>Revision</span><span>Status</span><span>Updated</span>
              </div>
              {filteredRows.map((row) => (
                <button type="button" role="row" key={row.id} data-testid="open-recent-project" onClick={() => workspace.onOpenRecentProject(row.id)}>
                  <strong>{row.name}<small>Cabinet Studio job</small></strong>
                  <span>{row.kindLabel}</span>
                  <span>Rev {row.revision}</span>
                  <span className={`interiors-project-status is-${row.statusTone}`}>{row.statusLabel}</span>
                  <small>{row.editedLabel}</small>
                </button>
              ))}
              {!filteredRows.length ? <p>No jobs match this view.</p> : null}
            </div>
            <details className="interiors-template-drawer">
              <summary>Quick start templates</summary>
              <InteriorsProjectsStarters onCreate={createProject} />
            </details>
            <InteriorsProjectsPhase1Qa onOpen={openPhase1} />
          </main>
        </div>
      )}
    </section>
  );
}
