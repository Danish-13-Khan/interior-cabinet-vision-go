import { useEffect, useMemo, useRef, useState } from "react";
import type {
  InteriorProject,
  RenderSettings,
} from "../domain/interiorProject";
import {
  compileLivingRoomScene,
  createLivingRoomRenderResult,
  applyRenderPresetToSettings,
  livingRoomRenderFileName,
  resolveStudioRenderMode,
  stillReviewExportStatusMessage,
  type LivingRoomLightingRecipeId,
  type LivingRoomRenderResult,
} from "../domain/livingRoom";
import {
  promptSavePath,
  writeBinaryBlob,
} from "../platform/desktopFiles";
import { useRenderDiagnostics } from "../hooks/useRenderDiagnostics";
import type { useClientPresentationExport } from "../hooks/useClientPresentationExport";
import { usePackageCameraBookmarkSettings } from "../hooks/usePackageCameraBookmarkSettings";
import { useRenderStudioHonesty } from "../hooks/useRenderStudioHonesty";
import { useStillReviewFlow } from "../hooks/useStillReviewFlow";
import type { AcceptedStillAsset } from "../hooks/selectPackageAcceptedStillAssets";
import { acceptedStillExportPayload } from "../hooks/selectPackageAcceptedStillAssets";
import { LivingRoomRenderCanvas } from "./LivingRoomRenderCanvas";
import type { RenderCaptureHandle } from "./livingRoomScene/RenderCaptureBridge";
import { RenderDiagnosticsPanel } from "./livingRoomScene/RenderDiagnosticsPanel";
import { LivingRoomRenderCamerasPanel } from "./livingRoomScene/LivingRoomRenderCamerasPanel";
import { LivingRoomRenderSettingsPanel } from "./livingRoomScene/LivingRoomRenderSettingsPanel";
import { RenderPresetHonestyBadge } from "./livingRoomScene/RenderPresetHonestyBadge";
import { StillReviewPanel } from "./livingRoomScene/StillReviewPanel";
import { StillTrustPanel } from "./livingRoomScene/StillTrustPanel";

type RenderJobState = {
  status: "idle" | "rendering" | "complete" | "cancelled" | "error";
  progress: number;
  stage: string;
  error: string | null;
};

type ClientExport = ReturnType<typeof useClientPresentationExport>;

type LivingRoomRenderStudioProps = {
  project: InteriorProject;
  latestResult: LivingRoomRenderResult | null;
  previousResult: LivingRoomRenderResult | null;
  onRendered: (result: LivingRoomRenderResult) => void;
  onSettingsChange: (patch: Partial<RenderSettings>) => void;
  onLightingChange: (recipeId: LivingRoomLightingRecipeId) => void;
  onBrowserThumbnail?: (dataUrl: string) => void;
  acceptedStillAssets?: AcceptedStillAsset[];
  onAcceptedStillAssetsChange?: React.Dispatch<React.SetStateAction<AcceptedStillAsset[]>>;
  clientExport: ClientExport;
  clientPackageBlocked: boolean;
};

const INITIAL_JOB: RenderJobState = {
  status: "idle",
  progress: 0,
  stage: "Ready",
  error: null,
};

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

export function LivingRoomRenderStudio({
  project,
  latestResult,
  previousResult,
  onRendered,
  onSettingsChange,
  onLightingChange,
  onBrowserThumbnail,
  acceptedStillAssets,
  onAcceptedStillAssetsChange,
  clientExport,
  clientPackageBlocked,
}: LivingRoomRenderStudioProps) {
  const scene = useMemo(() => compileLivingRoomScene(project), [project]);
  const [captureHandle, setCaptureHandle] = useState<RenderCaptureHandle | null>(null);
  const jobTokenRef = useRef(0);
  const [job, setJob] = useState<RenderJobState>(INITIAL_JOB);
  const [view, setView] = useState<"preview" | "result" | "compare" | "still">(
    latestResult ? "result" : "preview",
  );
  const [comparePosition, setComparePosition] = useState(50);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [exposureDraft, setExposureDraft] = useState(project.renderSettings.exposure);
  const [exportStatus, setExportStatus] = useState("");
  const packageDeck = usePackageCameraBookmarkSettings(project, onSettingsChange);
  const settings = project.renderSettings;
  const activeCamera = scene.cameras.find((camera) => camera.id === settings.activeCameraId)
    ?? scene.cameras.find((camera) => camera.isDefault)
    ?? scene.cameras[0];
  const isRendering = job.status === "rendering";
  const diagnostics = useRenderDiagnostics(scene, activeCamera);
  const studioRenderMode = resolveStudioRenderMode(settings.quality);
  const honesty = useRenderStudioHonesty(view, settings.quality, latestResult);
  const [heroStillLock, setHeroStillLock] = useState(false);
  const stills = useStillReviewFlow({
    project,
    cameraId: activeCamera?.id,
    acceptedStillAssets,
    onAcceptedStillAssetsChange,
    capture: captureHandle,
    widthPx: settings.widthPx,
    heightPx: settings.heightPx,
    composition: settings.composition,
    transparentBackground: settings.transparentBackground,
    beforeCapture: async () => {
      setHeroStillLock(true);
      await delay(400);
    },
    afterCapture: () => setHeroStillLock(false),
  });
  const resultIsCurrent = Boolean(
    latestResult
    && latestResult.projectId === project.id
    && latestResult.sceneFingerprint === scene.fingerprint
    && latestResult.cameraId === activeCamera?.id
    && latestResult.widthPx === settings.widthPx
    && latestResult.heightPx === settings.heightPx
    && latestResult.quality === settings.quality
    && latestResult.transparentBackground === settings.transparentBackground
    && latestResult.composition === settings.composition,
  );

  useEffect(() => setExposureDraft(settings.exposure), [settings.exposure]);

  useEffect(() => {
    const token = ++jobTokenRef.current;
    let disposed = false;
    void (async () => {
      await delay(350);
      const capture = captureHandle;
      if (!capture || disposed) return;
      const next: Record<string, string> = {};
      for (const camera of scene.cameras) {
        if (disposed || token !== jobTokenRef.current) return;
        next[camera.id] = await capture.capturePng({
          cameraId: camera.id,
          widthPx: 320,
          heightPx: 180,
          transparentBackground: false,
          composition: settings.composition,
        });
      }
      if (!disposed) setThumbnails(next);
    })().catch(() => {
      if (!disposed) setThumbnails({});
    });
    return () => {
      disposed = true;
      jobTokenRef.current += 1;
    };
  }, [captureHandle, scene.cameras, scene.fingerprint, settings.composition]);

  async function renderImage() {
    const capture = captureHandle;
    if (!capture || !activeCamera || isRendering) return;
    const token = ++jobTokenRef.current;
    const continueJob = () => token === jobTokenRef.current;
    setExportStatus("");
    setJob({ status: "rendering", progress: 8, stage: "Preparing scene", error: null });
    try {
      await delay(120);
      if (!continueJob()) return;
      setJob({ status: "rendering", progress: 32, stage: "Resolving materials and lights", error: null });
      await delay(120);
      if (!continueJob()) return;
      setJob({ status: "rendering", progress: 58, stage: "Rendering presentation frame", error: null });
      const dataUrl = await capture.capturePng({
        cameraId: activeCamera.id,
        widthPx: settings.widthPx,
        heightPx: settings.heightPx,
        transparentBackground: settings.transparentBackground,
        composition: settings.composition,
      });
      if (!continueJob()) return;
      setJob({ status: "rendering", progress: 90, stage: "Encoding PNG", error: null });
      await delay(100);
      if (!continueJob()) return;
      const result = createLivingRoomRenderResult({
        dataUrl,
        project,
        sceneFingerprint: scene.fingerprint,
        camera: activeCamera,
      });
      onRendered(result);
      onBrowserThumbnail?.(dataUrl);
      setView("result");
      setJob({ status: "complete", progress: 100, stage: "Render complete", error: null });
    } catch (error) {
      if (!continueJob()) return;
      setJob({
        status: "error",
        progress: 0,
        stage: "Render failed",
        error: error instanceof Error ? error.message : "Unknown render error",
      });
    }
  }

  function cancelRender() {
    jobTokenRef.current += 1;
    setJob({ status: "cancelled", progress: 0, stage: "Render cancelled", error: null });
  }

  async function exportPng() {
    if (!latestResult) return;
    try {
      const path = await promptSavePath({
        title: "Export Living Room Render",
        defaultPath: livingRoomRenderFileName(project.name, latestResult.cameraName),
        extensions: ["png"],
      });
      if (!path) {
        setExportStatus("Export cancelled.");
        return;
      }
      await writeBinaryBlob(path, await dataUrlToBlob(latestResult.dataUrl));
      setExportStatus("PNG saved successfully.");
    } catch (error) {
      setExportStatus(error instanceof Error ? `Export failed: ${error.message}` : "Export failed.");
    }
  }

  async function generateStill() {
    await stills.generateStill();
    setView("still");
  }

  return (
    <section className="lr-render-studio">
      <header className="lr-render-commandbar">
        <div>
          <span>RENDER STUDIO</span>
          <strong>{scene.style.name}</strong>
          <small>{scene.fingerprint.slice(-8).toUpperCase()}</small>
          <RenderPresetHonestyBadge honesty={honesty} tierId={honesty.tierId} compact />
        </div>
        <nav aria-label="Render result view">
          <button type="button" className={view === "preview" ? "is-active" : ""} onClick={() => setView("preview")}>Live Preview</button>
          <button type="button" className={view === "result" ? "is-active" : ""} onClick={() => setView("result")} disabled={!latestResult}>Result</button>
          <button type="button" className={view === "compare" ? "is-active" : ""} onClick={() => setView("compare")} disabled={!latestResult || !previousResult}>Compare</button>
          <button type="button" className={view === "still" ? "is-active" : ""} onClick={() => setView("still")}>Still review</button>
        </nav>
        <div className="lr-render-actions">
          {(job.status === "error" || job.status === "cancelled") ? <button type="button" onClick={() => void renderImage()}>Retry</button> : null}
          <button type="button" onClick={() => onSettingsChange(applyRenderPresetToSettings(settings, "draft"))}>
            Draft Preview
          </button>
          <button type="button" onClick={() => onSettingsChange(applyRenderPresetToSettings(settings, "presentation"))}>
            High Quality
          </button>
          <button type="button" className="is-primary" onClick={() => void renderImage()} disabled={isRendering || !activeCamera || !captureHandle}>
            {isRendering ? "Rendering…" : "Render Image"}
          </button>
          <button type="button" onClick={() => void generateStill()} disabled={stills.busy || isRendering || !activeCamera || !captureHandle}>
            {stills.busy ? "Generating still…" : "Generate Still"}
          </button>
          <button type="button" onClick={() => void exportPng()} disabled={!latestResult || isRendering}>Export PNG</button>
          <button
            type="button"
            onClick={() => latestResult && void clientExport.exportPresentationPdf(project, latestResult)}
            disabled={!latestResult || isRendering || clientExport.busy}
          >
            {clientExport.busy ? "Exporting…" : "Presentation PDF"}
          </button>
          <button
            type="button"
            title={clientPackageBlocked
              ? "Resolve layout conflicts and place millwork before export."
              : undefined}
            onClick={() => {
              if (clientPackageBlocked) return;
              const payload = acceptedStillExportPayload(stills.acceptedStills);
              void clientExport.exportClientPreview(
                project,
                latestResult,
                payload.provenance,
                payload.pngs,
              );
            }}
            disabled={isRendering || clientExport.busy || clientPackageBlocked}
          >
            {clientExport.busy ? "Packaging…" : "Client Package"}
          </button>
        </div>
      </header>

      <div className="lr-render-body">
        <LivingRoomRenderSettingsPanel
          settings={settings}
          exposureDraft={exposureDraft}
          styleExposure={scene.style.colorManagement.exposure}
          honesty={honesty}
          studioRenderMode={studioRenderMode}
          cameraName={activeCamera?.name}
          onExposureDraft={setExposureDraft}
          onSettingsChange={onSettingsChange}
          onLightingChange={onLightingChange}
        />

        <div className="lr-render-stage">
          <div
            className={`lr-render-live ${view === "preview" ? "is-visible" : ""}`}
            data-testid="lr-render-live"
          >
            {activeCamera ? (
              <LivingRoomRenderCanvas
                ref={setCaptureHandle}
                scene={scene}
                activeCameraId={activeCamera.id}
                quality={heroStillLock ? "client-preview" : settings.quality}
                composition={settings.composition}
                renderMode={heroStillLock ? "hero" : studioRenderMode}
              />
            ) : <div className="lr-render-empty">No project camera is available.</div>}
            {diagnostics && view === "preview" ? (
              <RenderDiagnosticsPanel report={diagnostics} />
            ) : null}
            {stills.session.job && view === "preview" ? (
              <StillTrustPanel
                overlay
                validation={stills.validation}
                provenance={stills.session.provenance}
              />
            ) : null}
          </div>
          {view === "result" && latestResult ? (
            <figure className="lr-render-result">
              <img src={latestResult.dataUrl} alt={`Render from ${latestResult.cameraName}`} />
              <figcaption>
                <strong>{latestResult.cameraName}</strong>
                <span>{latestResult.widthPx}×{latestResult.heightPx} · {latestResult.quality} · {latestResult.exposure.toFixed(2)} EV · {honesty.headline}</span>
                {!resultIsCurrent ? <b>Settings changed · render again</b> : <b className="is-current">Current</b>}
              </figcaption>
            </figure>
          ) : null}
          {view === "compare" && latestResult && previousResult ? (
            <div className="lr-render-compare">
              <img src={previousResult.dataUrl} alt="Previous render" />
              <div style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}>
                <img src={latestResult.dataUrl} alt="Latest render" />
              </div>
              <i style={{ left: `${comparePosition}%` }} />
              <input
                aria-label="Render comparison position"
                type="range"
                min="0"
                max="100"
                value={comparePosition}
                onChange={(event) => setComparePosition(Number(event.target.value))}
              />
              <span className="is-before">Previous</span>
              <span className="is-after">Latest</span>
            </div>
          ) : null}
          {view === "still" ? (
            <StillReviewPanel
              session={stills.session}
              plateDataUrl={stills.plateDataUrl}
              stillDataUrl={stills.stillDataUrl}
              diffDataUrl={stills.diffDataUrl}
              validation={stills.validation}
              compareMode={stills.compareMode}
              acceptedCount={stills.acceptedStills.length}
              busy={stills.busy}
              error={stills.error}
              onCompareMode={stills.setCompareMode}
              onAccept={stills.accept}
              onReject={stills.reject}
              onRetry={() => void stills.retry()}
            />
          ) : null}
          {isRendering ? (
            <div className="lr-render-progress" role="status">
              <span>RENDERING</span>
              <strong>{job.stage}</strong>
              <progress max="100" value={job.progress} />
              <small>{job.progress}%</small>
              <button type="button" onClick={cancelRender}>Cancel</button>
            </div>
          ) : null}
          {job.status === "error" ? <div className="lr-render-error">{job.error}</div> : null}
        </div>

        <LivingRoomRenderCamerasPanel
          cameras={scene.cameras}
          activeCameraId={activeCamera?.id}
          thumbnails={thumbnails}
          latestResult={latestResult}
          previousResult={previousResult}
          statusMessage={stillReviewExportStatusMessage({
            sessionStatus: stills.session.status,
            packageEligibleCount: stills.acceptedStills.length,
            exportStatus,
            clientExportStatus: clientExport.status,
          })}
          packageViews={packageDeck.packageViews}
          bookmarkedCameraIds={packageDeck.bookmarkedCameraIds}
          onSelectCamera={(cameraId) => onSettingsChange({ activeCameraId: cameraId })}
          onToggleBookmark={packageDeck.onToggleBookmark}
          onCommitViewName={packageDeck.onCommitViewName}
          onMoveView={packageDeck.onMoveView}
          onRemoveView={packageDeck.onRemoveView}
        />
      </div>
    </section>
  );
}
