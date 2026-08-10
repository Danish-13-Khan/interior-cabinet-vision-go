import type { ProjectJobMeta } from "../domain/jobMeta";
import type { WorkbenchMode } from "../domain/desktopUx";

type JobWorkspaceProps = {
  job: ProjectJobMeta;
  roomCount: number;
  cabinetCount: number;
  projectStatus: string;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onNavigate: (mode: WorkbenchMode) => void;
};

export function JobWorkspace({
  job,
  roomCount,
  cabinetCount,
  projectStatus,
  onNew,
  onOpen,
  onSave,
  onNavigate,
}: JobWorkspaceProps) {
  return (
    <section className="job-workspace" aria-label="Job workspace">
      <header className="job-workspace-header">
        <div>
          <span>{job.projectNumber || "JOB-001"}</span>
          <h1>{job.customerName || "Untitled Cabinet Project"}</h1>
          <p>{job.notes || "No project notes"}</p>
        </div>
        <div className="job-workspace-actions">
          <button type="button" className="tb-btn" onClick={onNew}>New Job</button>
          <button type="button" className="tb-btn" onClick={onOpen}>Open</button>
          <button type="button" className="tb-btn tb-accent" onClick={onSave}>Save</button>
        </div>
      </header>

      <div className="job-workspace-summary">
        <article><strong>{roomCount}</strong><span>Rooms</span></article>
        <article><strong>{cabinetCount}</strong><span>Cabinets</span></article>
        <article><strong>{job.revision || "A"}</strong><span>Revision</span></article>
        <article><strong>{job.status || "design"}</strong><span>Status</span></article>
      </div>

      <div className="job-workspace-flow">
        <div className="job-workspace-section-title">
          <strong>Continue Workflow</strong>
          <span>{projectStatus || "Ready"}</span>
        </div>
        <div className="job-workspace-cards">
          <button type="button" onClick={() => onNavigate("room")}>
            <span>01</span><strong>Plan Room</strong><small>Walls, openings and room dimensions</small>
          </button>
          <button type="button" onClick={() => onNavigate("cabinets")}>
            <span>02</span><strong>Design Cabinets</strong><small>Catalog, runs and cabinet assemblies</small>
          </button>
          <button type="button" onClick={() => onNavigate("drawings")}>
            <span>03</span><strong>Prepare Drawings</strong><small>Plans, elevations and technical sheets</small>
          </button>
          <button type="button" onClick={() => onNavigate("production")}>
            <span>04</span><strong>Prepare Production</strong><small>Materials, cutlists and costing</small>
          </button>
        </div>
      </div>
    </section>
  );
}
