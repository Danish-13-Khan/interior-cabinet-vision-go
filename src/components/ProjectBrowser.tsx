import { useMemo, useState } from "react";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_OPTIONS,
  clampJobMeta,
  createDefaultJobMeta,
  formatJobTitle,
  type JobStatus,
  type ProjectJobMeta,
} from "../domain/jobMeta";

type SavedProjectCard = {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail: string;
  job?: ProjectJobMeta;
  cabinetCount?: number;
};

type ProjectBrowserProps = {
  projects: SavedProjectCard[];
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onLoadProject: (projectId: string) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onSaveCurrent: () => void | Promise<void>;
  onProjectContextMenu?: (
    projectId: string,
    point: { x: number; y: number },
  ) => void;
};

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
}

export function ProjectBrowser({
  projects,
  onDeleteProject,
  onDuplicateProject,
  onLoadProject,
  onRenameProject,
  onSaveCurrent,
  onProjectContextMenu,
}: ProjectBrowserProps) {
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects.filter((project) => {
      const job = clampJobMeta(project.job ?? createDefaultJobMeta());
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (!needle) return true;
      const haystack = [
        project.name,
        job.customerName,
        job.projectNumber,
        job.revision,
        JOB_STATUS_LABELS[job.status],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [projects, query, statusFilter]);

  return (
    <div className="control-section job-browser">
      <div className="section-heading">
        <h2>Job Browser</h2>
        <span>{filtered.length} of {projects.length}</span>
      </div>

      <div className="project-actions">
        <button type="button" onClick={() => onSaveCurrent()}>
          Save Current Job
        </button>
      </div>

      <div className="job-browser-filters">
        <input
          type="search"
          value={query}
          placeholder="Search customer, job #, name…"
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.currentTarget.value as JobStatus | "all")
          }
        >
          <option value="all">All statuses</option>
          {JOB_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length > 0 ? (
        <div className="project-browser-grid">
          {filtered.map((project) => {
            const job = clampJobMeta(project.job ?? createDefaultJobMeta());
            const title = formatJobTitle(job, project.name);
            return (
              <article
                key={project.id}
                className="project-browser-card job-browser-card"
                onContextMenu={(event) => {
                  if (!onProjectContextMenu) return;
                  event.preventDefault();
                  onProjectContextMenu(project.id, {
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
              >
                <button
                  type="button"
                  className="project-browser-thumb"
                  onClick={() => onLoadProject(project.id)}
                  aria-label={`Open ${title}`}
                >
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={title} />
                  ) : (
                    <span>No preview</span>
                  )}
                </button>
                <div className="project-browser-meta">
                  <div className="job-browser-title-row">
                    <strong>{title}</strong>
                    <span className={`job-status-badge status-${job.status}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                  </div>
                  <span>
                    {job.projectNumber ? `${job.projectNumber} · ` : ""}
                    Rev {job.revision}
                    {typeof project.cabinetCount === "number"
                      ? ` · ${project.cabinetCount} cabinets`
                      : ""}
                  </span>
                  <span>{formatSavedAt(project.updatedAt)}</span>
                </div>
                <div className="project-browser-actions">
                  <button type="button" onClick={() => onLoadProject(project.id)}>
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newName = window.prompt("Rename job:", project.name);
                      if (newName && newName.trim()) {
                        onRenameProject(project.id, newName.trim());
                      }
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateProject(project.id)}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onDeleteProject(project.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="helper-note">
          {projects.length === 0
            ? "Save the current job once and it will appear here with status, customer, and preview."
            : "No jobs match the current search or status filter."}
        </p>
      )}
    </div>
  );
}
