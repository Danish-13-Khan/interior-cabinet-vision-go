import { useState, useSyncExternalStore } from "react";
import { enqueueBrowserDownload } from "../../platform/browserDownloadQueue";
import {
  exportSceneGlb,
  getModelViewScene,
  sceneGlbFileName,
  subscribeModelViewScene,
} from "../../rendering/sceneExport";

export function ReviewSceneExport({ projectName }: { projectName: string }) {
  const scene = useSyncExternalStore(subscribeModelViewScene, getModelViewScene, () => null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    const live = getModelViewScene();
    if (!live) return;
    setBusy(true);
    setError("");
    try {
      await enqueueBrowserDownload(await exportSceneGlb(live), sceneGlbFileName(projectName));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "GLB export failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="interiors-review-export" data-testid="review-scene-export">
      <button type="button" data-testid="review-export-glb" disabled={!scene || busy} onClick={() => void run()}>
        {busy ? "Exporting…" : "Export GLB"}
      </button>
      <small>
        {scene
          ? "Downloads the 3D view as shown, including cutaways. Grid, gizmos and lights are left out."
          : "Switch the canvas to the 3D view to export a GLB."}
      </small>
      {error ? <p className="lr-import-error">{error}</p> : null}
    </div>
  );
}
