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
  canvasView?: "plan" | "model" | "render";
  onCanvasView?: (view: "plan" | "model") => void;
  onPresent?: () => void;
  children: ReactNode;
};

export function StudioChrome(props: StudioChromeProps) {
  const designing = props.surface === "project" && props.workflow === "design";
  const settings = STUDIO_SECTIONS.find((item) => item.id === "settings");
  const sections = STUDIO_SECTIONS.filter((item) => item.id !== "settings");
  return (
    <section className={`studio-shell${props.collapsed ? " is-sidebar-collapsed" : ""}`} data-testid="studio-shell">
      <aside className="studio-sidebar" aria-label="Cabinet Studio">
        <div className="studio-brand">
          <span className="studio-mark" aria-hidden="true" />
          <span>
            <strong>Cabinet Studio</strong>
            <small>Drafting workspace</small>
          </span>
        </div>
        <p className="studio-nav-label">Workspace</p>
        <nav className="studio-nav" aria-label="Studio">
          {sections.map((item) => (
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
        {props.projectName ? (
          <div className="studio-current">
            <small>Current project</small>
            <strong>{props.projectName}</strong>
            <span>{props.roomName} · Rev {props.revision}</span>
          </div>
        ) : null}
        {settings ? (
          <button
            type="button"
            className={`studio-nav-btn studio-nav-foot${props.surface === "studio" && props.section === "settings" ? " is-active" : ""}`}
            aria-pressed={props.surface === "studio" && props.section === "settings"}
            onClick={() => props.onSection(settings.id)}
          >
            Workspace settings
          </button>
        ) : null}
      </aside>
      <header className="studio-topbar">
        <div className="studio-topbar-row">
          <div className="studio-topbar-leading">
            <button type="button" className="studio-btn studio-menu" onClick={props.onToggleSidebar} aria-label={props.collapsed ? "Show studio" : "Hide studio"}>
              {props.collapsed ? "Show" : "Hide"}
            </button>
            <div className="studio-title">
              <strong className="studio-crumb" data-testid="studio-breadcrumb">
                {props.projectOpen
                  ? studioBreadcrumb(props.projectName, props.roomName, props.revision)
                  : props.section === "projects"
                    ? "Projects / All work"
                    : studioBreadcrumb(props.projectName, props.roomName, props.revision)}
              </strong>
              {props.projectOpen ? <small>Rev {props.revision}</small> : null}
            </div>
          </div>
          <div className="studio-actions">
            {designing && props.onCanvasView ? (
              <div className="studio-view-switch" role="group" aria-label="Canvas view">
                <button type="button" className={`studio-btn${props.canvasView === "plan" ? " is-primary" : ""}`} onClick={() => props.onCanvasView?.("plan")}>2D plan</button>
                <button type="button" className={`studio-btn${props.canvasView === "model" || props.canvasView === "render" ? " is-primary" : ""}`} onClick={() => props.onCanvasView?.("model")}>3D review</button>
              </div>
            ) : null}
            {designing && props.onPresent ? <button type="button" className="studio-btn" onClick={props.onPresent}>Present</button> : null}
            {props.projectOpen ? <span className={`studio-badge is-${props.saveTone}`} data-testid="studio-save-status">{props.saveLabel === "Saved" ? "All changes saved" : props.saveLabel}</span> : null}
            {props.projectOpen ? <button type="button" className="studio-btn is-primary" onClick={props.onSave}>Save</button> : null}
          </div>
        </div>
        {props.projectOpen ? (
          <div className="studio-workflows" role="tablist" aria-label="Project workflow">
            {PROJECT_WORKFLOWS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                className={`studio-workflow-btn${props.workflow === item.id ? " is-active" : ""}`}
                aria-selected={props.workflow === item.id}
                onClick={() => props.onWorkflow(item.id)}
              >
                <span>{index + 1}</span>
                {item.short}
              </button>
            ))}
          </div>
        ) : null}
      </header>
      <div className={`studio-main${designing ? " is-design" : ""}`}>{props.children}</div>
    </section>
  );
}
