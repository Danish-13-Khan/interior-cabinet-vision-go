import type { ReactNode } from "react";
import {
  PROJECT_WORKFLOWS,
  STUDIO_SECTIONS,
  studioBreadcrumb,
  type ProjectWorkflow,
  type StudioSection,
  type StudioSurface,
} from "../../domain/studio/navigation";

type StudioChromeProps = {
  surface: StudioSurface;
  section: StudioSection;
  workflow: ProjectWorkflow;
  collapsed: boolean;
  projectName: string | null;
  roomName: string;
  revision: string;
  saveLabel: string;
  saveTone: "saved" | "error" | "idle";
  projectOpen: boolean;
  onSection: (section: StudioSection) => void;
  onWorkflow: (workflow: ProjectWorkflow) => void;
  onToggleSidebar: () => void;
  onSave: () => void;
  children: ReactNode;
};

export function StudioChrome(props: StudioChromeProps) {
  const designing = props.surface === "project" && props.workflow === "design";
  return (
    <section className={`studio-shell${props.collapsed ? " is-sidebar-collapsed" : ""}`} data-testid="studio-shell">
      <aside className="studio-sidebar" aria-label="Cabinet Studio">
        <p className="studio-brand">Cabinet Studio</p>
        <nav className="studio-nav" aria-label="Studio">
          {STUDIO_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`studio-nav-btn${props.surface === "studio" && props.section === item.id ? " is-active" : ""}`}
              aria-pressed={props.surface === "studio" && props.section === item.id}
              onClick={() => props.onSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <header className="studio-topbar">
        <div>
          <button type="button" className="studio-btn" onClick={props.onToggleSidebar}>
            {props.collapsed ? "Show studio" : "Hide studio"}
          </button>
          <strong className="studio-crumb" data-testid="studio-breadcrumb">
            {studioBreadcrumb(props.projectName, props.roomName, props.revision)}
          </strong>
        </div>
        <div className="studio-actions">
          <span className={`studio-badge is-${props.saveTone}`} data-testid="studio-save-status">{props.saveLabel}</span>
          <button type="button" className="studio-btn is-primary" onClick={props.onSave} disabled={!props.projectOpen}>Save</button>
        </div>
      </header>
      <div className="studio-workflows" role="tablist" aria-label="Project workflow">
        {PROJECT_WORKFLOWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className={`studio-workflow-btn${props.surface === "project" && props.workflow === item.id ? " is-active" : ""}`}
            aria-selected={props.surface === "project" && props.workflow === item.id}
            disabled={!props.projectOpen}
            onClick={() => props.onWorkflow(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={`studio-main${designing ? " is-design" : ""}`}>{props.children}</div>
    </section>
  );
}
