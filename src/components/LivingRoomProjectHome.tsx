import { useEffect, useMemo, useState } from "react";
import type { SavedProjectBrowserEntry } from "../domain/projectBrowserStorage";
import {
  createLivingRoomPlanThumbnail,
  createLivingRoomReleaseDemoProject,
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
  onOpenDemo: () => void;
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
  onOpenDemo,
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
  const releaseDemo = useMemo(() => createLivingRoomReleaseDemoProject(), []);

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
    <div className="lr-project-home" role="dialog" aria-modal="true" aria-label="Start a living room project">
      <header className="lr-project-home-header">
        <div>
          <span>INTERIORS / LIVING ROOM</span>
          <h1 id="lr-project-home-title">Start with a room worth presenting.</h1>
          <p>Plan the layout, inspect the spatial model, and create a client-ready image in one focused workflow.</p>
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

      <div className="lr-project-home-grid lr-home-reset-grid">
        <section className="lr-home-showcase">
          <img src={createLivingRoomPlanThumbnail(releaseDemo)} alt="Living Room Release Demo plan preview" />
          <div className="lr-showcase-overlay">
            <span>VERIFIED STARTER PROJECT</span>
            <h2>Living Room Release Demo</h2>
            <p>A complete Nordic-light room with furniture, lighting, cameras, validation, and render settings already prepared.</p>
            <div className="lr-showcase-facts"><b>12 objects</b><b>3 cameras</b><b>Render ready</b></div>
            <button
              type="button"
              className="lr-demo-primary"
              onClick={() => {
                onDiscardRecovery();
                onOpenDemo();
              }}
            >
              OPEN RELEASE DEMO <i>→</i>
            </button>
          </div>
        </section>

        <section className="lr-new-project-panel lr-new-project-compact">
          <div className="lr-home-section-title">
            <div><span>+</span><strong>New blank concept</strong></div>
            <small>6200 × 4600 × 2800 mm</small>
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
          <button type="button" className="lr-create-project" disabled={!projectName.trim()} onClick={createProject}>
            Create blank project <kbd>↵</kbd>
          </button>
        </section>

        <section className="lr-recent-projects lr-home-recents">
          <div className="lr-home-section-title">
            <div><span>↗</span><strong>Recent projects</strong></div>
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
              <p>Save a living-room project after rendering to pin a client preview thumbnail here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
