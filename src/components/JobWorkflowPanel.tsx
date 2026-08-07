import {
  JOB_STATUS_LABELS,
  JOB_STATUS_OPTIONS,
  type JobStatus,
  type ProjectJobMeta,
} from "../domain/jobMeta";

type JobWorkflowPanelProps = {
  job: ProjectJobMeta;
  onChange: (patch: Partial<ProjectJobMeta>) => void;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export function JobWorkflowPanel({ job, onChange }: JobWorkflowPanelProps) {
  return (
    <div className="control-section job-workflow-panel">
      <div className="section-heading">
        <h2>Job Workflow</h2>
        <span className={`job-status-badge status-${job.status}`}>
          {JOB_STATUS_LABELS[job.status]}
        </span>
      </div>

      <div className="job-workflow-pipeline" role="list" aria-label="Job status pipeline">
        {JOB_STATUS_OPTIONS.map((option, index) => {
          const activeIndex = JOB_STATUS_OPTIONS.findIndex((item) => item.value === job.status);
          const isActive = option.value === job.status;
          const isPast = index < activeIndex;
          return (
            <button
              key={option.value}
              type="button"
              role="listitem"
              className={`job-pipeline-step ${isActive ? "is-active" : ""} ${isPast ? "is-past" : ""}`}
              onClick={() => onChange({ status: option.value })}
              title={`Set status to ${option.label}`}
            >
              <span className="job-pipeline-dot" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="job-workflow-grid">
        <label>
          Customer
          <input
            type="text"
            value={job.customerName}
            placeholder="Customer / site name"
            onChange={(event) => onChange({ customerName: event.currentTarget.value })}
          />
        </label>
        <label>
          Project #
          <input
            type="text"
            value={job.projectNumber}
            placeholder="JOB-001"
            onChange={(event) => onChange({ projectNumber: event.currentTarget.value })}
          />
        </label>
        <label>
          Revision
          <input
            type="text"
            value={job.revision}
            placeholder="A"
            onChange={(event) => onChange({ revision: event.currentTarget.value })}
          />
        </label>
        <label>
          Status
          <select
            value={job.status}
            onChange={(event) =>
              onChange({ status: event.currentTarget.value as JobStatus })
            }
          >
            {JOB_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="job-notes-field">
        Job notes
        <textarea
          rows={3}
          value={job.notes}
          placeholder="Quote notes, site constraints, finish approvals…"
          onChange={(event) => onChange({ notes: event.currentTarget.value })}
        />
      </label>

      <div className="job-date-row">
        <div>
          <span className="job-date-label">Created</span>
          <strong>{formatDate(job.createdAt)}</strong>
        </div>
        <div>
          <span className="job-date-label">Updated</span>
          <strong>{formatDate(job.updatedAt)}</strong>
        </div>
        <div>
          <span className="job-date-label">Quoted</span>
          <strong>{formatDate(job.quotedAt)}</strong>
        </div>
        <div>
          <span className="job-date-label">Approved</span>
          <strong>{formatDate(job.approvedAt)}</strong>
        </div>
        <div>
          <span className="job-date-label">Production</span>
          <strong>{formatDate(job.productionAt)}</strong>
        </div>
      </div>
    </div>
  );
}
