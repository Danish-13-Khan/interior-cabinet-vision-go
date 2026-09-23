import type { LivingRoomStyleId, PlannerStarterTemplate } from "../../domain/livingRoom";
import { projectFilterCount, type ProjectDashboardLayout } from "../../domain/studio/projectDashboard";
import { ProjectJobBoard } from "../studio/ProjectJobBoard";
import { InteriorsPopularTemplates } from "./InteriorsPopularTemplates";
import { InteriorsProjectsPhase1Qa } from "./InteriorsProjectsPhase1Qa";
import { InteriorsProjectsStarters } from "./InteriorsProjectsStarters";
import type { LivingRoomPlanWorkspaceProps } from "./workspaceProps";

export type ProjectFilter = "all" | "design" | "quoted" | "engineering";

type RecentRow = {
  id: string;
  name: string;
  kindLabel: string;
  revision: string | number;
  statusTone: string;
  statusLabel: string;
  editedLabel: string;
};

type Props = {
  workspace: LivingRoomPlanWorkspaceProps;
  hasCurrentProject: boolean;
  projectName: string;
  onProjectName: (name: string) => void;
  query: string;
  onQuery: (query: string) => void;
  filter: ProjectFilter;
  onFilter: (filter: ProjectFilter) => void;
  recentRows: RecentRow[];
  filteredRows: RecentRow[];
  layout: ProjectDashboardLayout;
  onLayout: (layout: ProjectDashboardLayout) => void;
  onCreateProject: (template?: PlannerStarterTemplate, styleId?: LivingRoomStyleId) => void;
  onCreateCatalogTemplate: (catalogTemplateId: string) => void;
  onOpenPhase1: (benchmarkId: Parameters<LivingRoomPlanWorkspaceProps["onOpenPhase1Benchmark"]>[0]) => void;
};

/** Compact-pro project home: filter rail + job table. */
export function InteriorsCompactProjectsHome({
  workspace,
  hasCurrentProject,
  projectName,
  onProjectName,
  query,
  onQuery,
  filter,
  onFilter,
  recentRows,
  filteredRows,
  layout,
  onLayout,
  onCreateProject,
  onCreateCatalogTemplate,
  onOpenPhase1,
}: Props) {
  return (
    <div className="interiors-compact-projects">
      <aside className="interiors-project-filters" aria-label="Project filters">
        <span>Workspace</span>
        {([
          ["all", "All jobs"],
          ["design", "In design"],
          ["quoted", "Quoted"],
          ["engineering", "Engineering"],
        ] as Array<[ProjectFilter, string]>).map(([id, label]) => (
          <button key={id} type="button" className={filter === id ? "is-selected" : ""} onClick={() => onFilter(id)}>
            <span>{label}</span>
            <small>{projectFilterCount(recentRows, id)}</small>
          </button>
        ))}
      </aside>
      <main className="interiors-job-table-wrap">
        <header className="interiors-job-heading">
          <div><span>Active jobs</span><h1>Cabinet jobs</h1></div>
          <label className="interiors-job-search">
            <span>Search jobs</span>
            <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Project, room or status" />
          </label>
          <label className="interiors-compact-job-name">
            <span>New job name</span>
            <input
              value={projectName} maxLength={80} data-testid="interiors-job-name"
              data-dialog-initial-focus
              onChange={(event) => onProjectName(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") onCreateProject(); }}
            />
          </label>
          <button type="button" onClick={workspace.onOpenProject}>Import</button>
          <button type="button" className="is-primary" data-testid="interiors-new-job" disabled={!projectName.trim()} onClick={() => onCreateProject()}>
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
        <ProjectJobBoard rows={filteredRows} layout={layout} onLayout={onLayout} onOpen={workspace.onOpenRecentProject} />
        <details className="interiors-template-drawer">
          <summary>Quick start templates</summary>
          <InteriorsPopularTemplates onCreate={onCreateCatalogTemplate} />
          <InteriorsProjectsStarters onCreate={onCreateProject} />
        </details>
        {import.meta.env.DEV ? (
          <details className="interiors-template-drawer interiors-dev-qa">
            <summary>Developer · Phase 1 QA</summary>
            <InteriorsProjectsPhase1Qa onOpen={onOpenPhase1} />
          </details>
        ) : null}
      </main>
    </div>
  );
}
