import { projectFilterCount, projectLandingStats, type ProjectDashboardFilter, type ProjectDashboardLayout } from "../../domain/studio/projectDashboard";
import { InteriorsPopularTemplates } from "../livingRoomPlan/InteriorsPopularTemplates";
import { ProjectJobBoard } from "./ProjectJobBoard";

type Row = {
  id: string;
  name: string;
  kindLabel: string;
  revision: string | number;
  statusTone: string;
  statusLabel: string;
  editedLabel: string;
  thumbnail?: string;
  sellLabel?: string;
  clientName?: string;
};

const FILTERS: Array<[ProjectDashboardFilter, string]> = [
  ["all", "All"],
  ["design", "Designing"],
  ["quoted", "Quoted"],
  ["approved", "Approved"],
  ["engineering", "Engineering"],
];

export function StudioProjectsLanding(props: {
  rows: Row[];
  filtered: Row[];
  query: string;
  onQuery: (value: string) => void;
  filter: ProjectDashboardFilter;
  onFilter: (filter: ProjectDashboardFilter) => void;
  layout: ProjectDashboardLayout;
  onLayout: (layout: ProjectDashboardLayout) => void;
  projectName: string;
  onProjectName: (value: string) => void;
  onCreate: () => void;
  onOpenFile: () => void;
  onOpenProject: (id: string) => void;
  onOpenSample: () => void;
  onCreateTemplate: (catalogTemplateId: string) => void;
  recoveryName: string | null;
  onRestore: () => void;
  onDiscard: () => void;
  hasCurrentProject: boolean;
  onReturn: () => void;
}) {
  const stats = projectLandingStats(props.rows, props.recoveryName ? 1 : 0);
  return (
    <div className="studio-landing" data-testid="studio-projects-landing">
      <header className="studio-landing-head">
        <div>
          <p>Studio overview</p>
          <h1>Your projects</h1>
          <small>Keep every drawing, quote, and production detail moving together.</small>
        </div>
        <div className="studio-landing-create">
          <input
            value={props.projectName}
            maxLength={80}
            aria-label="Job name"
            data-testid="interiors-job-name"
            data-dialog-initial-focus
            onChange={(event) => props.onProjectName(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") props.onCreate(); }}
          />
          <button type="button" className="studio-btn is-primary" data-testid="interiors-new-job" disabled={!props.projectName.trim()} onClick={props.onCreate}>
            Create project
          </button>
          <button type="button" className="studio-btn" onClick={props.onOpenFile}>Open project</button>
          {props.hasCurrentProject ? <button type="button" className="studio-btn" onClick={props.onReturn}>Return</button> : null}
        </div>
      </header>
      {props.recoveryName ? (
        <section className="studio-restore" data-testid="interiors-recovery">
          <span>Autosave available · {props.recoveryName}</span>
          <button type="button" className="studio-btn is-primary" data-testid="interiors-recovery-restore" onClick={props.onRestore}>Restore</button>
          <button type="button" className="studio-btn" data-testid="interiors-recovery-discard" onClick={props.onDiscard}>Discard</button>
        </section>
      ) : null}
      <div className="studio-stat-grid">
        <article className="is-sage"><small>Active projects</small><strong>{stats.active}</strong><span>{stats.active} need your attention</span></article>
        <article><small>Awaiting client</small><strong>{stats.awaitingTotal ? stats.awaitingTotal.toLocaleString() : "—"}</strong><span>{stats.awaitingCount} quotes in review</span></article>
        <article><small>In production</small><strong>{stats.inProduction}</strong><span>Released jobs</span></article>
        <article><small>Recovery points</small><strong>{stats.recoveryPoints}</strong><span>On this device</span></article>
      </div>
      <div className="studio-landing-tools">
        <div>
          <h2>Recent projects</h2>
          <small>{props.filtered.length} of {props.rows.length} projects shown</small>
        </div>
        <input value={props.query} aria-label="Search projects" placeholder="Search projects or clients" onChange={(event) => props.onQuery(event.target.value)} />
        <div className="studio-tabs">
          <button type="button" className={`studio-btn${props.layout === "grid" ? " is-primary" : ""}`} onClick={() => props.onLayout("grid")}>Grid</button>
          <button type="button" className={`studio-btn${props.layout === "list" ? " is-primary" : ""}`} onClick={() => props.onLayout("list")}>List</button>
        </div>
      </div>
      <div className="studio-chips" role="tablist" aria-label="Project status">
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" className={props.filter === id ? "is-selected" : ""} onClick={() => props.onFilter(id)}>
            {label} {projectFilterCount(props.rows, id)}
          </button>
        ))}
      </div>
      <ProjectJobBoard rows={props.filtered} layout={props.layout} onLayout={props.onLayout} onOpen={props.onOpenProject} showLayout={false} />
      <InteriorsPopularTemplates onCreate={props.onCreateTemplate} />
      <button type="button" className="studio-btn studio-sample" onClick={props.onOpenSample}>Open sample kitchen</button>
    </div>
  );
}
