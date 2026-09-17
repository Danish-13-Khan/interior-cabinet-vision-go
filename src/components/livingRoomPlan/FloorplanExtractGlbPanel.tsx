import { useEffect, useState } from "react";
import {
  FLOORPLAN_PREVIEW_OWNERSHIP_NOTE,
  exportFloorplanBuilding,
  exportFloorplanGlb,
  wrapSingleFloorBuilding,
  type ExtractionResult,
  type NormalizeIssue,
} from "../../domain/floorplanExtract";
import { FloorplanPreviewViewport } from "../floorplanPreview/FloorplanPreviewViewport";

type Props = {
  draft: ExtractionResult;
  draftKey: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onError: (message: string) => void;
  issues?: NormalizeIssue[];
  /** When true, parent should hide its duplicate issue list. */
  onPreviewOpenChange?: (open: boolean) => void;
};

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Primary View 3D + downloads (same P0a cache blob). */
export function FloorplanExtractGlbPanel({
  draft, draftKey, busy, setBusy, onError, issues = [], onPreviewOpenChange,
}: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const notes = issues.filter((i) => !i.blocksApply);
  const blocks = issues.filter((i) => i.blocksApply);

  useEffect(() => {
    onPreviewOpenChange?.(showPreview);
  }, [showPreview, onPreviewOpenChange]);

  return (
    <div className="lr-floorplan-extract-glb-panel" data-testid="lr-floorplan-extract-glb-panel">
      <div className="lr-floorplan-extract-glb-actions">
        <button
          type="button"
          className="is-primary"
          disabled={busy}
          data-testid="lr-floorplan-show-3d-preview"
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? "Hide 3D preview" : "View 3D"}
        </button>
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
          {busy ? "Exporting…" : "Download GLB"}
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
      </div>
      {showPreview ? (
        <div className="lr-floorplan-extract-preview-row" data-testid="lr-floorplan-extract-preview-row">
          <FloorplanPreviewViewport draft={draft} draftKey={draftKey} />
          <aside className="lr-floorplan-preview-issues" aria-label="Floor plan notes">
            {blocks.length === 0 && notes.length === 0 ? (
              <p>{FLOORPLAN_PREVIEW_OWNERSHIP_NOTE}</p>
            ) : (
              <ul>
                {blocks.map((issue, i) => (
                  <li key={`b-${i}`} className="is-block">Block: {issue.message}</li>
                ))}
                {notes.map((issue, i) => (
                  <li key={`n-${i}`} className="is-note">Note: {issue.message}</li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
