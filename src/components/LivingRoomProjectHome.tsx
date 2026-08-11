import { useEffect, useMemo, useState } from "react";
import type { SavedProjectBrowserEntry } from "../domain/projectBrowserStorage";
import {
  createLivingRoomPlanThumbnail,
  LIVING_ROOM_STYLE_PRESETS,
  type LivingRoomRecoverySnapshot,
  type LivingRoomStyleId,
} from "../domain/livingRoom";

type LivingRoomProjectHomeProps = {
  open: boolean;
  hasCurrentProject: boolean;
  isDirty: boolean;
  recentProjects: SavedProjectBrowserEntry[];
  recovery: LivingRoomRecoverySnapshot | null;
  onClose: () => void;
  onCreate: (options: { projectName: string; styleId: LivingRoomStyleId }) => void;
  onOpenRecent: (projectId: string) => void;
  onDeleteRecent: (projectId: string) => void;
  onRestoreRecovery: () => void;
  onDiscardRecovery: () => void;
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleString();
}

export function LivingRoomProjectHome({
  open,
  hasCurrentProject,
  isDirty,
  recentProjects,
  recovery,
  onClose,
  onCreate,
  onOpenRecent,
  onDeleteRecent,
  onRestoreRecovery,
  onDiscardRecovery,
}: LivingRoomProjectHomeProps) {
  const [projectName, setProjectName] = useState("Living Room Concept");
  const [styleId, setStyleId] = useState<LivingRoomStyleId>("warm-contemporary");
  const livingRoomRecents = useMemo(
    () => recentProjects.filter((entry) =>
      entry.project.interiorDocument?.rooms.some((room) => room.roomType === "living-room"),
    ).slice(0, 6),
    [recentProjects],
  );

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && hasCurrentProject) onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [hasCurrentProject, onClose, open]);

  if (!open) return null;

  function createProject() {
    if (!projectName.trim()) return;
    onDiscardRecovery();
    onCreate({ projectName: projectName.trim(), styleId });
  }

  return (
    <div className="lr-project-home" role="dialog" aria-modal="true" aria-labelledby="lr-project-home-title">
      <header className="lr-project-home-header">
        <div>
          <span>INTERIOR DESIGN WORKSPACE</span>
          <h1 id="lr-project-home-title">Start a living room project</h1>
          <p>Choose a visual direction, refine it in Plan, review it in Model, then produce a presentation render.</p>
        </div>
        {hasCurrentProject ? (
          <button type="button" className="lr-home-close" onClick={onClose}>Return to project</button>
        ) : null}
      </header>

      {recovery ? (
        <section className="lr-recovery-card">
          <div>
            <span>AUTOSAVE RECOVERY</span>
            <strong>{recovery.project.name}</strong>
            <small>Recovered checkpoint · {formatTimestamp(recovery.savedAt)}</small>
          </div>
          <button type="button" className="is-primary" onClick={onRestoreRecovery}>Restore project</button>
          <button type="button" onClick={onDiscardRecovery}>Discard</button>
        </section>
      ) : null}

      <div className="lr-project-home-grid">
        <section className="lr-new-project-panel">
          <div className="lr-home-section-title">
            <div><span>01</span><strong>New project</strong></div>
            <small>6200 × 4600 × 2800 mm starter</small>
          </div>
          <label className="lr-project-name-field">
            <span>Project name</span>
            <input
              value={projectName}
              maxLength={80}
              onChange={(event) => setProjectName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") createProject();
              }}
            />
          </label>
          <div className="lr-style-starters" role="radiogroup" aria-label="Starter style">
            {LIVING_ROOM_STYLE_PRESETS.map((style) => (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={styleId === style.id}
                className={styleId === style.id ? "is-selected" : ""}
                onClick={() => setStyleId(style.id)}
              >
                <span className="lr-style-preview" style={{ background: `linear-gradient(135deg, ${style.swatches[0]} 0 45%, ${style.swatches[1]} 45% 73%, ${style.swatches[2]} 73%)` }}>
                  <i /><i /><i />
                </span>
                <strong>{style.name}</strong>
                <small>{style.description}</small>
              </button>
            ))}
          </div>
          {hasCurrentProject && isDirty ? (
            <p className="lr-replace-warning">The current project has changes that have not been saved to disk.</p>
          ) : null}
          <button
            type="button"
            className="lr-create-project"
            disabled={!projectName.trim()}
            onClick={createProject}
          >
            Create and open Plan <kbd>↵</kbd>
          </button>
        </section>

        <section className="lr-recent-projects">
          <div className="lr-home-section-title">
            <div><span>02</span><strong>Recent projects</strong></div>
            <small>{livingRoomRecents.length} available</small>
          </div>
          {livingRoomRecents.length ? (
            <div className="lr-recent-grid">
              {livingRoomRecents.map((entry) => {
                const document = entry.project.interiorDocument!;
                const preview = entry.thumbnail || createLivingRoomPlanThumbnail(document);
                return (
                  <article key={entry.id}>
                    <button
                      type="button"
                      className="lr-recent-open"
                      onClick={() => {
                        onDiscardRecovery();
                        onOpenRecent(entry.id);
                      }}
                    >
                      <span className="lr-recent-thumb">
                        {preview ? <img src={preview} alt="" /> : <i>PLAN PREVIEW</i>}
                      </span>
                      <strong>{entry.name}</strong>
                      <small>{document.objects.length} objects · {formatTimestamp(entry.updatedAt)}</small>
                    </button>
                    <button type="button" className="lr-recent-delete" onClick={() => onDeleteRecent(entry.id)} aria-label={`Remove ${entry.name}`}>×</button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="lr-recent-empty">
              <strong>No saved living rooms yet</strong>
              <p>Use Save in the ribbon after creating a project. Its plan thumbnail will appear here automatically.</p>
            </div>
          )}
          <div className="lr-journey-strip">
            <span><b>1</b> Plan</span><i>→</i><span><b>2</b> Model</span><i>→</i><span><b>3</b> Render</span>
          </div>
        </section>
      </div>
    </div>
  );
}
