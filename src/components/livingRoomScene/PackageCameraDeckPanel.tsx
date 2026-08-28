import type { ResolvedPackageCameraView } from "../../domain/livingRoom";
import { PackageCameraDeckViewNameInput } from "./PackageCameraDeckViewNameInput";

type PackageCameraDeckPanelProps = {
  views: ResolvedPackageCameraView[];
  onCommitViewName: (cameraId: string, viewName: string) => void;
  onMoveView: (cameraId: string, direction: -1 | 1) => void;
  onRemoveView: (cameraId: string) => void;
};

export function PackageCameraDeckPanel({
  views,
  onCommitViewName,
  onMoveView,
  onRemoveView,
}: PackageCameraDeckPanelProps) {
  return (
    <section className="lr-package-deck" aria-label="Package camera deck">
      <header>
        <strong>Package deck</strong>
        <span>{views.length}</span>
      </header>
      {views.length ? (
        <ol className="lr-package-deck-list">
          {views.map((view, index) => (
            <li key={view.cameraId}>
              <label>
                <span>View {view.sortOrder}</span>
                <PackageCameraDeckViewNameInput
                  cameraId={view.cameraId}
                  cameraName={view.cameraName}
                  viewName={view.viewName}
                  onCommitViewName={onCommitViewName}
                />
              </label>
              <small>{view.cameraName} · {view.fieldOfViewDegrees}°</small>
              <div className="lr-package-deck-actions">
                <button type="button" aria-label="Move view up" disabled={index === 0} onClick={() => onMoveView(view.cameraId, -1)}>↑</button>
                <button type="button" aria-label="Move view down" disabled={index === views.length - 1} onClick={() => onMoveView(view.cameraId, 1)}>↓</button>
                <button type="button" aria-label="Remove from package deck" onClick={() => onRemoveView(view.cameraId)}>Remove</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="lr-package-deck-empty">Bookmark cameras below to build a repeatable client deck.</p>
      )}
    </section>
  );
}
