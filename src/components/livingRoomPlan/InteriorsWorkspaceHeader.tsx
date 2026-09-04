import {
  interiorsSaveLabel,
  type InteriorsUiMode,
} from "../../domain/desktopUx";
import type { LivingRoomWorkspaceView } from "./workspaceProps";
import { InteriorsChromeIcon } from "./InteriorsChromeIcons";

type InteriorsWorkspaceHeaderProps = {
  projectName: string | null;
  roomName: string;
  revision: string;
  statusLabel: string;
  workspaceView: LivingRoomWorkspaceView;
  isDirty: boolean;
  autosaveState: "idle" | "saving" | "saved" | "error";
  canUndo: boolean;
  canRedo: boolean;
  presenting: boolean;
  chromeLocked?: boolean;
  projectHome?: boolean;
  uiMode?: InteriorsUiMode;
  onUiMode?: (mode: InteriorsUiMode) => void;
  onProject: () => void;
  onView: (view: LivingRoomWorkspaceView) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPresent: () => void;
};

export function InteriorsWorkspaceHeader({
  projectName,
  roomName,
  revision,
  statusLabel,
  workspaceView,
  isDirty,
  autosaveState,
  canUndo,
  canRedo,
  presenting,
  chromeLocked = false,
  projectHome = false,
  uiMode = "calm",
  onUiMode,
  onProject,
  onView,
  onSave,
  onUndo,
  onRedo,
  onPresent,
}: InteriorsWorkspaceHeaderProps) {
  const saveLabel = interiorsSaveLabel(isDirty, autosaveState);
  const hasProject = Boolean(projectName);
  const modelActive = workspaceView === "model" || workspaceView === "render";

  return (
    <header
      className="lr-chrome-header"
      data-testid="interiors-workspace-header"
      aria-label="Workspace"
      aria-hidden={chromeLocked || undefined}
      inert={chromeLocked || undefined}
    >
      <button type="button" className="lr-chrome-brand" onClick={onProject} aria-label="Cabinet Studio home">
        <span className="lr-product-mark"><i /><i /><i /></span>
        <strong>Cabinet Studio</strong>
      </button>
      {projectHome ? (
        <nav className="lr-projects-nav" aria-label="Projects navigation">
          <span className="is-active">Projects</span>
          <span>Library</span>
        </nav>
      ) : (
        <button
          type="button"
          className="lr-chrome-crumb"
          data-testid="interiors-project-crumb"
          aria-label="Open projects"
          onClick={onProject}
        >
          <strong>{projectName ?? "Projects"}</strong>
          <span>
            {projectName ? `${roomName} · Rev ${revision} · ${statusLabel}` : "Cabinet jobs"}
          </span>
        </button>
      )}
      {projectHome && onUiMode ? (
        <div className="lr-projects-mode" role="group" aria-label="Workspace style" data-testid="interiors-ui-mode-menu">
          <button
            type="button"
            className={uiMode === "calm" ? "is-selected" : ""}
            aria-pressed={uiMode === "calm"}
            data-testid="interiors-mode-calm"
            onClick={() => onUiMode("calm")}
          >
            Calm
          </button>
          <button
            type="button"
            className={uiMode === "compact" ? "is-selected" : ""}
            aria-pressed={uiMode === "compact"}
            data-testid="interiors-mode-compact"
            onClick={() => onUiMode("compact")}
          >
            Compact
          </button>
        </div>
      ) : null}
      {!projectHome ? (
        <div className="lr-chrome-history">
          <button type="button" aria-label="Undo" title="Undo" onClick={onUndo} disabled={!canUndo}>
            <InteriorsChromeIcon name="undo" />
          </button>
          <button type="button" aria-label="Redo" title="Redo" onClick={onRedo} disabled={!canRedo}>
            <InteriorsChromeIcon name="redo" />
          </button>
        </div>
      ) : null}
      {!projectHome ? (
        <div className="lr-view-switch" role="group" aria-label="Canvas view">
          <button
            type="button"
            className={workspaceView === "plan" ? "is-active" : ""}
            title="2D plan"
            onClick={() => onView("plan")}
            disabled={!hasProject}
          >
            2D
          </button>
          <button
            type="button"
            className={modelActive ? "is-active" : ""}
            title="3D model"
            onClick={() => onView("model")}
            disabled={!hasProject}
          >
            3D
          </button>
        </div>
      ) : null}
      {!projectHome ? (
        <div className="lr-chrome-actions">
          <button
            type="button"
            className={`lr-chrome-save${isDirty ? " is-dirty" : ""}`}
            data-testid="interiors-save-state"
            onClick={onSave}
            disabled={!hasProject || autosaveState === "saving"}
          >
            {saveLabel === "Saved" ? <InteriorsChromeIcon name="check" /> : null}
            {saveLabel}
          </button>
          <button
            type="button"
            className={`lr-chrome-present${presenting ? " is-active" : ""}`}
            data-testid="interiors-present"
            onClick={onPresent}
            disabled={!hasProject}
          >
            Present
          </button>
        </div>
      ) : null}
    </header>
  );
}
