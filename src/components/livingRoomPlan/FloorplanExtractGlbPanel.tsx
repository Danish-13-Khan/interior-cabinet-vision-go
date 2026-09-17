import { useState } from "react";
import type { ExtractionResult } from "../../domain/floorplanExtract";
import {
  exportFloorplanBuilding,
  exportFloorplanGlb,
  wrapSingleFloorBuilding,
} from "../../domain/floorplanExtract";
import { FloorplanPreviewViewport } from "../floorplanPreview/FloorplanPreviewViewport";

type Props = {
  draft: ExtractionResult;
  draftKey: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onError: (message: string) => void;
};

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download + in-app sidecar preview (same P0a cache blob). */
export function FloorplanExtractGlbPanel({ draft, draftKey, busy, setBusy, onError }: Props) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="lr-floorplan-extract-glb-panel" data-testid="lr-floorplan-extract-glb-panel">
      <div className="lr-floorplan-extract-glb-actions">
        <button
          type="button"
          disabled={busy}
          onClick={() => void (async () => {
            setBusy(true);
            try {
              downloadBlob(await exportFloorplanGlb(draft), "floorplan-preview.glb");
            } catch (e) {
              onError(e instanceof Error ? e.message : "GLB export failed.");
            } finally {
              setBusy(false);
            }
          })}
        >
          {busy ? "Exporting…" : "Download GLB preview"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void (async () => {
            setBusy(true);
            try {
              downloadBlob(
                await exportFloorplanBuilding(wrapSingleFloorBuilding(draft)),
                "floorplan-building.glb",
              );
            } catch (e) {
              onError(e instanceof Error ? e.message : "Building export failed.");
            } finally {
              setBusy(false);
            }
          })}
        >
          Download building GLB
        </button>
        <button
          type="button"
          disabled={busy}
          data-testid="lr-floorplan-show-3d-preview"
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? "Hide 3D preview" : "Show 3D preview"}
        </button>
      </div>
      {showPreview ? <FloorplanPreviewViewport draft={draft} draftKey={draftKey} /> : null}
    </div>
  );
}
