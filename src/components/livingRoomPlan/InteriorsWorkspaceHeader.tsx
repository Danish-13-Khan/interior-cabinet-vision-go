import { useEffect, useState, type ReactNode } from "react";
import { interiorsSaveLabel } from "../../domain/desktopUx";
import { editorStatus } from "../../domain/projectDrafts/browserSignals";
import { useStorageWarnings } from "../../hooks/useStorageWarnings";
import type { LivingRoomWorkspaceView } from "./workspaceProps";
import { InteriorsChromeIcon } from "./InteriorsChromeIcons";
import { InteriorsWorkspaceFileMenu } from "./InteriorsWorkspaceFileMenu";

type InteriorsWorkspaceHeaderProps = {
  /** Hidden-trigger overlays owned by the job menu (e.g. project tools dialog). */
  tools?: ReactNode;
  steps?: ReactNode;
  projectName: string | null;
  projectId?: string | null;
  roomName: string;
  revision: string;
  statusLabel: string;
  workspaceView: LivingRoomWorkspaceView;
  isDirty: boolean;
  autosaveState: "idle" | "saving" | "saved" | "error";
  lastAutosavedAt?: string | null;
  canUndo: boolean;
  canRedo: boolean;
  presenting: boolean;
  chromeLocked?: boolean;
  projectHome?: boolean;
  onProject: () => void;
  onProjectTools?: () => void;
  onOpen: () => void;
  onExport: () => void;
  onView: (view: LivingRoomWorkspaceView) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPresent: () => void;
  onOpenShortcuts?: () => void;
};

/** Single 48px top bar: brand · job ▾ · numbered steps · undo/redo · view · save · Present. */
export function InteriorsWorkspaceHeader(props: InteriorsWorkspaceHeaderProps) {
  const { projectName, workspaceView, isDirty, autosaveState, chromeLocked = false, projectHome = false } = props;
  const [now, setNow] = useState(() => Date.now());
  const [activity, setActivity] = useState("");
  useEffect(() => editorStatus.subscribe(setActivity), []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const saveLabel = interiorsSaveLabel(isDirty, autosaveState, props.lastAutosavedAt ?? null, now);
  const storageWarnings = useStorageWarnings();
  const hasProject = Boolean(projectName);
  const modelActive = workspaceView === "model" || workspaceView === "render";

  return (
    <header
      className="lr-chrome-header app-topbar"
      data-testid="interiors-workspace-header"
      aria-label="Workspace"
      aria-hidden={chromeLocked || undefined}
      inert={chromeLocked || undefined}
    >
      <button type="button" className="lr-chrome-brand" onClick={props.onProject} aria-label="Cabinet Studio home">
        <span className="lr-product-mark"><i /><i /><i /></span>
        <strong>Cabinet Studio</strong>
      </button>
      {projectHome ? (
        <nav className="lr-projects-nav" aria-label="Projects navigation">
          <span className="is-active">Projects</span>
          <span>Library</span>
        </nav>
      ) : (
        <div className="app-topbar-job">
          <button
            type="button"
            className="lr-chrome-crumb"
            data-testid="interiors-project-crumb"
            aria-label="Open projects"
            title={projectName ? `${projectName} · ${props.roomName} · Rev ${props.revision}` : undefined}
            onClick={props.onProject}
          >
            <strong>{projectName ?? "Projects"}</strong>
            <span>{projectName ? `Rev ${props.revision} · ${props.statusLabel}` : "Cabinet jobs"}</span>
          </button>
          <InteriorsWorkspaceFileMenu
            projectId={props.projectId}
            disabled={!hasProject}
            onProjectTools={props.onProjectTools}
            onOpen={props.onOpen}
            onSave={props.onSave}
            onExport={props.onExport}
            onOpenShortcuts={props.onOpenShortcuts}
          />
          {props.tools}
        </div>
      )}
      {!projectHome ? <div className="app-topbar-steps">{props.steps}</div> : null}
      {!projectHome ? (
        <div className="app-topbar-end">
          <div className="lr-chrome-history">
            <button type="button" aria-label="Undo" title="Undo" onClick={props.onUndo} disabled={!props.canUndo}>
              <InteriorsChromeIcon name="undo" />
            </button>
            <button type="button" aria-label="Redo" title="Redo" onClick={props.onRedo} disabled={!props.canRedo}>
              <InteriorsChromeIcon name="redo" />
            </button>
          </div>
          <div className="lr-view-switch" role="group" aria-label="Canvas view">
            <button type="button" className={workspaceView === "plan" ? "is-active" : ""} title="2D plan"
              onClick={() => props.onView("plan")} disabled={!hasProject}>2D plan</button>
            <button type="button" className={modelActive ? "is-active" : ""} title="3D model"
              onClick={() => props.onView("model")} disabled={!hasProject}>3D</button>
          </div>
          <div className="lr-chrome-actions">
            {activity ? <p className="lr-chrome-status" role="status" data-testid="interiors-activity-status">{activity}</p> : null}
            {storageWarnings.length ? (
              <p className="lr-storage-warning" role="alert" data-testid="interiors-storage-warning" title={storageWarnings.join("\n")}>
                <i aria-hidden="true">!</i>
                <span>{storageWarnings[0]}</span>
                {storageWarnings.length > 1 ? <b>+{storageWarnings.length - 1}</b> : null}
              </p>
            ) : null}
            <button
              type="button"
              className={`lr-chrome-save${isDirty ? " is-dirty" : ""}`}
              data-testid="interiors-save-state"
              onClick={props.onSave}
              disabled={!hasProject || autosaveState === "saving"}
            >
              {saveLabel.startsWith("Saved") ? <InteriorsChromeIcon name="check" /> : null}
              {saveLabel}
            </button>
            <button
              type="button"
              className={`lr-chrome-present${props.presenting ? " is-active" : ""}`}
              data-testid="interiors-present"
              onClick={props.onPresent}
              disabled={!hasProject}
            >
              Present
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
