import type { CameraEntity } from "../../domain/interiorProject";
import type { LivingRoomRenderResult } from "../../domain/livingRoom";

type LivingRoomRenderCamerasPanelProps = {
  cameras: CameraEntity[];
  activeCameraId: string | null | undefined;
  thumbnails: Record<string, string>;
  latestResult: LivingRoomRenderResult | null;
  previousResult: LivingRoomRenderResult | null;
  statusMessage: string;
  onSelectCamera: (cameraId: string) => void;
};

export function LivingRoomRenderCamerasPanel({
  cameras,
  activeCameraId,
  thumbnails,
  latestResult,
  previousResult,
  statusMessage,
  onSelectCamera,
}: LivingRoomRenderCamerasPanelProps) {
  return (
    <aside className="lr-render-cameras" aria-label="Render cameras">
      <header><strong>Cameras</strong><span>{cameras.length}</span></header>
      {cameras.map((camera, index) => (
        <button
          type="button"
          key={camera.id}
          className={camera.id === activeCameraId ? "is-active" : ""}
          onClick={() => onSelectCamera(camera.id)}
        >
          <span className="lr-camera-thumbnail">
            {thumbnails[camera.id]
              ? <img src={thumbnails[camera.id]} alt="" />
              : <i>CAM {String(index + 1).padStart(2, "0")}</i>}
          </span>
          <strong>{camera.name}</strong>
          <small>{camera.fieldOfViewDegrees}° lens</small>
        </button>
      ))}
      <div className="lr-render-history">
        <strong>Render History</strong>
        <span>{latestResult ? "Latest frame ready" : "No renders yet"}</span>
        <span>{previousResult ? "Comparison frame ready" : "Render twice to compare"}</span>
      </div>
      {statusMessage ? <p>{statusMessage}</p> : null}
    </aside>
  );
}
