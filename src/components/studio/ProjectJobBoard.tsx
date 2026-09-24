import type { ProjectDashboardLayout } from "../../domain/studio/projectDashboard";

type Row = {
  id: string;
  name: string;
  kindLabel: string;
  revision: string | number;
  statusTone: string;
  statusLabel: string;
  editedLabel: string;
  clientName?: string;
  cabinetCount?: number;
  roomCount?: number;
  thumbnail?: string;
  sellLabel?: string;
};

export function ProjectJobBoard(props: {
  rows: Row[];
  layout: ProjectDashboardLayout;
  onLayout: (layout: ProjectDashboardLayout) => void;
  onOpen: (id: string) => void;
  showLayout?: boolean;
}) {
  return (
    <section className="studio-project-board" data-testid="studio-project-board">
      {props.showLayout === false ? null : <div className="studio-tabs" role="tablist" aria-label="Project layout">
        <button type="button" className={`studio-btn${props.layout === "grid" ? " is-primary" : ""}`} onClick={() => props.onLayout("grid")}>Grid</button>
        <button type="button" className={`studio-btn${props.layout === "list" ? " is-primary" : ""}`} onClick={() => props.onLayout("list")}>List</button>
      </div>}
      {props.rows.length === 0 ? <p className="studio-state">No saved projects in this view. Create a project or open the sample kitchen.</p> : null}
      <div className={props.layout === "grid" ? "studio-project-grid" : "studio-project-list"}>
        {props.rows.map((row) => (
          <button type="button" key={row.id} className="studio-card studio-project-card" data-testid="open-recent-project" onClick={() => props.onOpen(row.id)}>
            {row.thumbnail ? <img className="studio-project-thumb" src={row.thumbnail} alt="" /> : <span className="studio-project-thumb" aria-hidden="true" />}
            <span className={`studio-badge is-${row.statusTone}`}>{row.statusLabel}</span>
            <span className="studio-project-title">
              <strong>{row.name}</strong>
              {row.sellLabel ? <em>{row.sellLabel}</em> : null}
            </span>
            <span>{row.clientName || "No client"}</span>
            <span>{row.kindLabel}</span>
            <span>Rev {row.revision}</span>
            <small>{row.editedLabel}</small>
            <small className="studio-project-trail">Design · Pricing · Production</small>
          </button>
        ))}
      </div>
    </section>
  );
}
