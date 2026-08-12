import { useEffect, useMemo, useRef, useState } from "react";
import type {
  InteriorProject,
  RenderSettings,
} from "../domain/interiorProject";
import {
  compileLivingRoomScene,
  createLivingRoomRenderResult,
  livingRoomRenderFileName,
  LIVING_ROOM_LIGHTING_RECIPES,
  matchRenderOutputPreset,
  RENDER_OUTPUT_PRESETS,
  RENDER_QUALITY_PRESETS,
  type LivingRoomLightingRecipeId,
  type LivingRoomRenderResult,
} from "../domain/livingRoom";
import {
  promptSavePath,
  writeBinaryBlob,
} from "../platform/desktopFiles";
import { LivingRoomRenderCanvas } from "./LivingRoomRenderCanvas";
import type { RenderCaptureHandle } from "./livingRoomScene/RenderCaptureBridge";

type RenderJobState = {
  status: "idle" | "rendering" | "complete" | "cancelled" | "error";
  progress: number;
  stage: string;
  error: string | null;
};

type LivingRoomRenderStudioProps = {
  project: InteriorProject;
  latestResult: LivingRoomRenderResult | null;
  previousResult: LivingRoomRenderResult | null;
  onRendered: (result: LivingRoomRenderResult) => void;
  onSettingsChange: (patch: Partial<RenderSettings>) => void;
  onLightingChange: (recipeId: LivingRoomLightingRecipeId) => void;
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
}: LivingRoomRenderStudioProps) {
  const scene = useMemo(() => compileLivingRoomScene(project), [project]);
  const [captureHandle, setCaptureHandle] = useState<RenderCaptureHandle | null>(null);
  const jobTokenRef = useRef(0);
  const [job, setJob] = useState<RenderJobState>(INITIAL_JOB);
  const [view, setView] = useState<"preview" | "result" | "compare">(
    latestResult ? "result" : "preview",
  );
  const [comparePosition, setComparePosition] = useState(50);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [exposureDraft, setExposureDraft] = useState(project.renderSettings.exposure);
  const [exportStatus, setExportStatus] = useState("");
  const settings = project.renderSettings;
  const activeCamera = scene.cameras.find((camera) => camera.id === settings.activeCameraId)
    ?? scene.cameras.find((camera) => camera.isDefault)
    ?? scene.cameras[0];
  const outputPreset = matchRenderOutputPreset(settings);
  const isRendering = job.status === "rendering";
  const resultIsCurrent = Boolean(
    latestResult
    && latestResult.projectId === project.id
    && latestResult.sceneFingerprint === scene.fingerprint
    && latestResult.cameraId === activeCamera?.id
    && latestResult.widthPx === settings.widthPx
    && latestResult.heightPx === settings.heightPx
    && latestResult.quality === settings.quality
    && latestResult.transparentBackground === settings.transparentBackground,
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
  }, [captureHandle, scene.cameras, scene.fingerprint]);

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

  return (
    <section className="lr-render-studio">
      <header className="lr-render-commandbar">
        <div>
          <span>RENDER STUDIO</span>
          <strong>{scene.style.name}</strong>
          <small>{scene.fingerprint.slice(-8).toUpperCase()}</small>
        </div>
        <nav aria-label="Render result view">
          <button type="button" className={view === "preview" ? "is-active" : ""} onClick={() => setView("preview")}>Live Preview</button>
          <button type="button" className={view === "result" ? "is-active" : ""} onClick={() => setView("result")} disabled={!latestResult}>Result</button>
          <button type="button" className={view === "compare" ? "is-active" : ""} onClick={() => setView("compare")} disabled={!latestResult || !previousResult}>Compare</button>
        </nav>
        <div className="lr-render-actions">
          {(job.status === "error" || job.status === "cancelled") ? <button type="button" onClick={() => void renderImage()}>Retry</button> : null}
          <button type="button" className="is-primary" onClick={() => void renderImage()} disabled={isRendering || !activeCamera || !captureHandle}>
            {isRendering ? "Rendering…" : "Render Image"}
          </button>
          <button type="button" onClick={() => void exportPng()} disabled={!latestResult || isRendering}>Export PNG</button>
        </div>
      </header>

      <div className="lr-render-body">
        <aside className="lr-render-settings" aria-label="Render settings">
          <section>
            <h3>Quality</h3>
            <div className="lr-render-quality-grid">
              {RENDER_QUALITY_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={settings.quality === preset.id ? "is-active" : ""}
                  onClick={() => onSettingsChange({ quality: preset.id })}
                >
                  <strong>{preset.name}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>Output</h3>
            <label className="lr-render-field">
              <span>Resolution</span>
              <select
                value={outputPreset?.id ?? "custom"}
                onChange={(event) => {
                  const preset = RENDER_OUTPUT_PRESETS.find((item) => item.id === event.target.value)!;
                  onSettingsChange({ widthPx: preset.widthPx, heightPx: preset.heightPx });
                }}
              >
                {!outputPreset ? <option value="custom" disabled>Custom · {settings.widthPx}×{settings.heightPx}</option> : null}
                {RENDER_OUTPUT_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.name} · {preset.widthPx}×{preset.heightPx}</option>
                ))}
              </select>
            </label>
            <label className="lr-render-check">
              <input
                type="checkbox"
                checked={settings.transparentBackground}
                onChange={(event) => onSettingsChange({ transparentBackground: event.target.checked })}
              />
              Transparent background
            </label>
          </section>
          <section>
            <h3>Lighting</h3>
            <label className="lr-render-field">
              <span>Light rig</span>
              <select
                value={settings.lightingRecipeId}
                onChange={(event) => onLightingChange(event.target.value as LivingRoomLightingRecipeId)}
              >
                {LIVING_ROOM_LIGHTING_RECIPES.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
              </select>
            </label>
            <label className="lr-render-exposure">
              <span>Exposure <b>{exposureDraft.toFixed(2)}</b></span>
              <input
                type="range"
                min="0.5"
                max="1.6"
                step="0.05"
                value={exposureDraft}
                onChange={(event) => setExposureDraft(Number(event.target.value))}
                onPointerUp={() => onSettingsChange({ exposure: exposureDraft })}
                onKeyUp={() => onSettingsChange({ exposure: exposureDraft })}
              />
            </label>
          </section>
          <section className="lr-render-summary">
            <h3>Frame Summary</h3>
            <dl>
              <dt>Camera</dt><dd>{activeCamera?.name ?? "None"}</dd>
              <dt>Output</dt><dd>{settings.widthPx} × {settings.heightPx}</dd>
              <dt>Pixels</dt><dd>{(settings.widthPx * settings.heightPx / 1_000_000).toFixed(1)} MP</dd>
              <dt>Pipeline</dt><dd>ACES / sRGB</dd>
            </dl>
          </section>
        </aside>

        <div className="lr-render-stage">
          <div className={`lr-render-live ${view === "preview" ? "is-visible" : ""}`}>
            {activeCamera ? (
              <LivingRoomRenderCanvas
                ref={setCaptureHandle}
                scene={scene}
                activeCameraId={activeCamera.id}
                quality={settings.quality}
              />
            ) : <div className="lr-render-empty">No project camera is available.</div>}
          </div>
          {view === "result" && latestResult ? (
            <figure className="lr-render-result">
              <img src={latestResult.dataUrl} alt={`Render from ${latestResult.cameraName}`} />
              <figcaption>
                <strong>{latestResult.cameraName}</strong>
                <span>{latestResult.widthPx}×{latestResult.heightPx} · {latestResult.quality} · {latestResult.exposure.toFixed(2)} EV</span>
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

        <aside className="lr-render-cameras" aria-label="Render cameras">
          <header><strong>Cameras</strong><span>{scene.cameras.length}</span></header>
          {scene.cameras.map((camera, index) => (
            <button
              type="button"
              key={camera.id}
              className={camera.id === activeCamera?.id ? "is-active" : ""}
              onClick={() => onSettingsChange({ activeCameraId: camera.id })}
            >
              <span className="lr-camera-thumbnail">
                {thumbnails[camera.id] ? <img src={thumbnails[camera.id]} alt="" /> : <i>CAM {String(index + 1).padStart(2, "0")}</i>}
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
          {exportStatus ? <p>{exportStatus}</p> : null}
        </aside>
      </div>
    </section>
  );
}
