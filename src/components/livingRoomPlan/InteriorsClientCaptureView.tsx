import { useMemo, useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  compileLivingRoomScene,
  createLivingRoomRenderResult,
  resolveStudioRenderMode,
  type LivingRoomRenderResult,
} from "../../domain/livingRoom";
import { LivingRoomRenderCanvas } from "../LivingRoomRenderCanvas";
import type { RenderCaptureHandle } from "../livingRoomScene/RenderCaptureBridge";

type InteriorsClientCaptureViewProps = {
  project: InteriorProject;
  latestResult: LivingRoomRenderResult | null;
  onRendered: (result: LivingRoomRenderResult) => void;
  onBrowserThumbnail?: (dataUrl: string) => void;
};

export function InteriorsClientCaptureView({
  project,
  latestResult,
  onRendered,
  onBrowserThumbnail,
}: InteriorsClientCaptureViewProps) {
  const scene = useMemo(() => compileLivingRoomScene(project), [project]);
  const settings = project.renderSettings;
  const activeCamera = scene.cameras.find((camera) => camera.id === settings.activeCameraId)
    ?? scene.cameras.find((camera) => camera.isDefault)
    ?? scene.cameras[0];
  const [captureHandle, setCaptureHandle] = useState<RenderCaptureHandle | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function captureFrame() {
    const capture = captureHandle;
    if (!capture || !activeCamera || busy) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await capture.capturePng({
        cameraId: activeCamera.id,
        widthPx: settings.widthPx,
        heightPx: settings.heightPx,
        transparentBackground: settings.transparentBackground,
        composition: settings.composition,
      });
      const result = createLivingRoomRenderResult({
        dataUrl,
        project,
        sceneFingerprint: scene.fingerprint,
        camera: activeCamera,
      });
      onRendered(result);
      onBrowserThumbnail?.(dataUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not capture this view.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="interiors-client-capture" data-testid="interiors-client-capture">
      <div className="interiors-client-capture-stage">
        {activeCamera ? (
          <LivingRoomRenderCanvas
            ref={setCaptureHandle}
            scene={scene}
            activeCameraId={activeCamera.id}
            quality={settings.quality}
            composition={settings.composition}
            renderMode={resolveStudioRenderMode(settings.quality)}
          />
        ) : (
          <p className="interiors-client-capture-empty">No project camera is available.</p>
        )}
        {latestResult ? (
          <img
            className="interiors-client-capture-result"
            src={latestResult.dataUrl}
            alt={`Render from ${latestResult.cameraName}`}
          />
        ) : null}
      </div>
      <div className="interiors-client-capture-bar">
        <button
          type="button"
          className="is-primary"
          onClick={() => void captureFrame()}
          disabled={busy || !activeCamera || !captureHandle}
        >
          {busy ? "Rendering…" : "Render Image"}
        </button>
        {error ? <p className="interiors-client-capture-error">{error}</p> : null}
      </div>
    </section>
  );
}
