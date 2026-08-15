import type { WorkbenchMode } from "../../domain/desktopUx";
import type { LivingRoomWorkspaceView } from "./workspaceProps";

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
  isDirty,
  canUndo,
  canRedo,
  onProject,
  onView,
  onOpen,
  onSave,
  onExport,
  onUndo,
  onRedo,
  onWorkbenchModeChange,
}: {
  projectName: string | null;
  workspaceView: LivingRoomWorkspaceView;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onProject: () => void;
  onView: (view: LivingRoomWorkspaceView) => void;
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
      <nav className="lr-product-nav" aria-label="Interiors workflow">
        <button type="button" aria-label="Home" onClick={onProject}><ProductIcon name="home" />Project</button>
        {(["plan", "model", "render"] as const).map((view) => (
          <button
            type="button"
            key={view}
            className={workspaceView === view ? "is-active" : ""}
            onClick={() => onView(view)}
            disabled={!projectName}
          >
            <span className="lr-nav-index">{view === "plan" ? "2D" : view === "model" ? "3D" : "FX"}</span>
            {view[0].toUpperCase() + view.slice(1)}
          </button>
        ))}
        <button type="button" onClick={onExport} disabled={!projectName}><span className="lr-nav-index">OUT</span>Export</button>
      </nav>
      <div className="lr-product-actions">
        <button type="button" className="lr-icon-button" aria-label="Open project" title="Open project" onClick={onOpen}><ProductIcon name="folder" /></button>
        <button type="button" className="lr-icon-button" aria-label="Undo" title="Undo" onClick={onUndo} disabled={!canUndo}><ProductIcon name="undo" /></button>
        <button type="button" className="lr-icon-button" aria-label="Redo" title="Redo" onClick={onRedo} disabled={!canRedo}><ProductIcon name="redo" /></button>
        <button type="button" className="lr-save-button" onClick={onSave} disabled={!projectName}><ProductIcon name="save" />{isDirty ? "Save *" : "Save"}</button>
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
