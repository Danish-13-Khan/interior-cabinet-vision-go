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
};

export function ProjectJobBoard(props: {
  rows: Row[];
  layout: ProjectDashboardLayout;
  onLayout: (layout: ProjectDashboardLayout) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="studio-project-board" data-testid="studio-project-board">
      <div className="studio-tabs" role="tablist" aria-label="Project layout">
        <button type="button" className={`studio-btn${props.layout === "grid" ? " is-primary" : ""}`} onClick={() => props.onLayout("grid")}>Grid</button>
        <button type="button" className={`studio-btn${props.layout === "list" ? " is-primary" : ""}`} onClick={() => props.onLayout("list")}>List</button>
      </div>
      {props.rows.length === 0 ? <p className="studio-state">No jobs match this view.</p> : null}
      <div className={props.layout === "grid" ? "studio-project-grid" : "studio-project-list"}>
        {props.rows.map((row) => (
          <button type="button" key={row.id} className="studio-card studio-project-card" data-testid="open-recent-project" onClick={() => props.onOpen(row.id)}>
            {row.thumbnail ? <img className="studio-project-thumb" src={row.thumbnail} alt="" /> : <span className="studio-project-thumb" aria-hidden="true" />}
            <strong>{row.name}</strong>
            <span>{row.clientName || "No client"}</span>
            <span>{row.kindLabel}</span>
            <span>{row.roomCount ?? 0} rooms · {row.cabinetCount ?? 0} cabinets · Rev {row.revision}</span>
            <span className={`studio-badge is-${row.statusTone}`}>{row.statusLabel}</span>
            <small>{row.editedLabel}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
