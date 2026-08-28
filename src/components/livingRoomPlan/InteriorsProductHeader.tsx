import type { WorkbenchMode } from "../../domain/desktopUx";
import type { LivingRoomWorkspaceView, PlannerMode } from "./workspaceProps";

function ProductIcon({ name }: { name: "home" | "folder" | "undo" | "redo" | "save" }) {
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/></>,
    folder: <path d="M3 6.5h7l2-2h9v15H3z"/>,
    undo: <><path d="m9 7-5 5 5 5"/><path d="M5 12h8.5a6 6 0 0 1 6 6"/></>,
    redo: <><path d="m15 7 5 5-5 5"/><path d="M19 12h-8.5a6 6 0 0 0-6 6"/></>,
    save: <><path d="M4 3h13l3 3v15H4z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function InteriorsProductHeader({
  projectName,
  workspaceView,
  plannerMode,
  isDirty,
  canUndo,
  canRedo,
  onProject,
  onView,
  onPlannerMode,
  onOpen,
  onSave,
  onExport,
  onUndo,
  onRedo,
  onWorkbenchModeChange,
}: {
  projectName: string | null;
  workspaceView: LivingRoomWorkspaceView;
  plannerMode: PlannerMode;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onProject: () => void;
  onView: (view: LivingRoomWorkspaceView) => void;
  onPlannerMode: (mode: PlannerMode) => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onWorkbenchModeChange: (mode: WorkbenchMode) => void;
}) {
  return (
    <header className="lr-product-header">
      <button type="button" className="lr-product-brand" onClick={onProject}>
        <span className="lr-product-mark"><i /><i /><i /></span>
        <span><strong>Interiors</strong><small>{projectName ?? "Living room studio"}</small></span>
      </button>
      <nav className="lr-product-nav" aria-label="Planner workflow">
        {(["project", "build", "design", "render"] as const).map((mode) => (
          <button
            type="button"
            key={mode}
            className={plannerMode === mode ? "is-active" : ""}
            onClick={() => onPlannerMode(mode)}
            disabled={mode !== "project" && !projectName}
          >
            <span className="lr-nav-index">{mode === "project" ? "01" : mode === "build" ? "02" : mode === "design" ? "03" : "04"}</span>
            {mode[0].toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </nav>
      <label className="lr-mobile-mode-picker">
        <span>Mode</span>
        <select value={plannerMode} onChange={(event) => onPlannerMode(event.target.value as PlannerMode)}>
          <option value="project">Project</option><option value="build" disabled={!projectName}>Build</option><option value="design" disabled={!projectName}>Design</option><option value="render" disabled={!projectName}>Render</option>
        </select>
      </label>
      <div className="lr-product-actions">
        <button type="button" className="lr-icon-button" aria-label="Home" title="Project home" onClick={onProject}><ProductIcon name="home" /></button>
        <button type="button" className="lr-icon-button" aria-label="Open project" title="Open project" onClick={onOpen}><ProductIcon name="folder" /></button>
        <button type="button" className="lr-icon-button" aria-label="Undo" title="Undo" onClick={onUndo} disabled={!canUndo}><ProductIcon name="undo" /></button>
        <button type="button" className="lr-icon-button" aria-label="Redo" title="Redo" onClick={onRedo} disabled={!canRedo}><ProductIcon name="redo" /></button>
        <button type="button" className="lr-save-button" onClick={onSave} disabled={!projectName}><ProductIcon name="save" />{isDirty ? "Save *" : "Save"}</button>
        <div className="lr-view-switch" role="group" aria-label="Canvas view">
          <button type="button" className={workspaceView === "plan" ? "is-active" : ""} onClick={() => onView("plan")} disabled={!projectName}>2D</button>
          <button
            type="button"
            className={workspaceView === "model" || workspaceView === "render" ? "is-active" : ""}
            onClick={() => onView(workspaceView === "render" ? "render" : "model")}
            disabled={!projectName}
          >3D</button>
        </div>
        <button type="button" className="lr-export-button" title="Download project JSON (not a millwork schedule)" onClick={onExport} disabled={!projectName}>Export JSON</button>
        <label className="lr-workspace-picker">
          <span>Workspace</span>
          <select value="interiors" onChange={(event) => onWorkbenchModeChange(event.target.value as WorkbenchMode)}>
            <option value="interiors">Interiors</option>
            <option value="job">Job</option>
            <option value="room">Room</option>
            <option value="cabinets">Cabinets</option>
            <option value="drawings">Drawings</option>
            <option value="production">Production</option>
            <option value="reports">Reports</option>
          </select>
        </label>
      </div>
    </header>
  );
}
