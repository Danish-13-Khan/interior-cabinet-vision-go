import type { CameraEntity } from "../../domain/interiorProject";
import type { LivingRoomRenderResult, ResolvedPackageCameraView } from "../../domain/livingRoom";
import { PackageCameraDeckPanel } from "./PackageCameraDeckPanel";

type LivingRoomRenderCamerasPanelProps = {
  cameras: CameraEntity[];
  activeCameraId: string | null | undefined;
  thumbnails: Record<string, string>;
  latestResult: LivingRoomRenderResult | null;
  previousResult: LivingRoomRenderResult | null;
  statusMessage: string;
  packageViews: ResolvedPackageCameraView[];
  bookmarkedCameraIds: Set<string>;
  onSelectCamera: (cameraId: string) => void;
  onToggleBookmark: (cameraId: string) => void;
  onCommitViewName: (cameraId: string, viewName: string) => void;
  onMoveView: (cameraId: string, direction: -1 | 1) => void;
  onRemoveView: (cameraId: string) => void;
};

export function LivingRoomRenderCamerasPanel({
  cameras,
  activeCameraId,
  thumbnails,
  latestResult,
  previousResult,
  statusMessage,
  packageViews,
  bookmarkedCameraIds,
  onSelectCamera,
  onToggleBookmark,
  onCommitViewName,
  onMoveView,
  onRemoveView,
}: LivingRoomRenderCamerasPanelProps) {
  return (
    <aside className="lr-render-cameras" aria-label="Saved project cameras">
      <PackageCameraDeckPanel
        views={packageViews}
        onCommitViewName={onCommitViewName}
        onMoveView={onMoveView}
        onRemoveView={onRemoveView}
      />
      <header><strong>Saved cameras</strong><span>{cameras.length}</span></header>
      {cameras.map((camera, index) => {
        const bookmarked = bookmarkedCameraIds.has(camera.id);
        return (
          <article
            key={camera.id}
            className={`lr-camera-card${camera.id === activeCameraId ? " is-active" : ""}`}
          >
            <button
              type="button"
              className="lr-camera-select"
              onClick={() => onSelectCamera(camera.id)}
              aria-label={`${camera.name} camera, ${camera.fieldOfViewDegrees} degree lens`}
            >
              <span className="lr-camera-thumbnail">
                {thumbnails[camera.id]
                  ? <img src={thumbnails[camera.id]} alt="" />
                  : <i>CAM {String(index + 1).padStart(2, "0")}</i>}
              </span>
              <strong>{camera.name}</strong>
              <small>{camera.isDefault ? "Default · " : "Saved · "}{camera.fieldOfViewDegrees}° lens</small>
            </button>
            <button
              type="button"
              className={`lr-camera-bookmark${bookmarked ? " is-active" : ""}`}
              aria-label={bookmarked ? "Remove from package deck" : "Add to package deck"}
              aria-pressed={bookmarked}
              onClick={() => onToggleBookmark(camera.id)}
            >
              {bookmarked ? "In deck" : "Bookmark"}
            </button>
          </article>
        );
      })}
      <div className="lr-render-history">
        <strong>Render History</strong>
        <span>{latestResult ? "Latest frame ready" : "No renders yet"}</span>
        <span>{previousResult ? "Comparison frame ready" : "Render twice to compare"}</span>
      </div>
      {statusMessage ? <p>{statusMessage}</p> : null}
    </aside>
  );
}
