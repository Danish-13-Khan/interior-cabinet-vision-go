import { useEffect, useMemo, useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  applyFloorplanToInterior,
  exportFloorplanGlb,
  normalizeExtraction,
  rescaleExtractionCoords,
  type ExtractionResult,
  type NormalizedFloorplan,
} from "../../domain/floorplanExtract";
import { FloorplanExtractOverlay } from "./FloorplanExtractOverlay";

type Props = {
  draft: ExtractionResult;
  draftKey: string;
  project: InteriorProject;
  onClose: () => void;
  onApply: (next: InteriorProject, status: string) => void;
  onError: (message: string) => void;
};

export function FloorplanExtractReview(props: Props) {
  const [workingDraft, setWorkingDraft] = useState(props.draft);
  const [acceptThin, setAcceptThin] = useState(false);
  const [scaleConfirmed, setScaleConfirmed] = useState(false);
  const [scaleInput, setScaleInput] = useState(String(props.draft.pixel_scale ?? 0.01));
  const [busy, setBusy] = useState(false);

  // Reset when a newer extraction arrives (or remount key changes).
  useEffect(() => {
    setWorkingDraft(props.draft);
    setAcceptThin(false);
    setScaleConfirmed(false);
    setScaleInput(String(props.draft.pixel_scale ?? 0.01));
    setBusy(false);
  }, [props.draftKey, props.draft]);

  const normalized: NormalizedFloorplan = useMemo(
    () => normalizeExtraction(workingDraft, { acceptThinWalls: acceptThin }),
    [workingDraft, acceptThin],
  );
  const applyEnabled = normalized.canApply && scaleConfirmed;
  const trimmedOpenings = Object.entries(normalized.openingAttachments)
    .filter(([, a]) => a.status === "matched" && a.trimmed);

  const applyScaleEdit = () => {
    const nextScale = Number(scaleInput);
    if (!(nextScale > 0)) {
      props.onError("pixel_scale must be a positive number");
      return;
    }
    const prev = workingDraft.pixel_scale && workingDraft.pixel_scale > 0
      ? workingDraft.pixel_scale
      : 0.01;
    setWorkingDraft({
      ...rescaleExtractionCoords(workingDraft, nextScale / prev),
      pixel_scale: nextScale,
    });
    setScaleConfirmed(false);
  };

  const apply = () => {
    if (!applyEnabled) return;
    try {
      const next = applyFloorplanToInterior(props.project, normalized);
      props.onApply(next, "Applied floor plan topology.");
      props.onClose();
    } catch (error) {
      props.onError(error instanceof Error ? error.message : "Apply failed.");
    }
  };

  const previewGlb = async () => {
    setBusy(true);
    try {
      const blob = await exportFloorplanGlb(normalized.draft);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "floorplan-preview.glb"; a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      props.onError(error instanceof Error ? error.message : "GLB export failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lr-floorplan-extract-review" data-testid="lr-floorplan-extract-review" role="dialog" aria-label="Floor plan extract review">
      <header>
        <strong>Floor plan → 3D</strong>
        <button type="button" onClick={props.onClose}>Close</button>
      </header>

      <FloorplanExtractOverlay draft={workingDraft} normalized={normalized} />

      <label>
        pixel_scale (m/unit)
        <input data-testid="lr-floorplan-scale-input" value={scaleInput}
          onChange={(e) => setScaleInput(e.target.value)} onBlur={applyScaleEdit} />
      </label>
      <button type="button" onClick={applyScaleEdit}>Apply scale to draft</button>

      <label>
        <input type="checkbox" data-testid="lr-floorplan-scale-confirmed"
          checked={scaleConfirmed} onChange={(e) => setScaleConfirmed(e.target.checked)} />
        I confirmed scale against the underlay / known dimension
      </label>
      <label>
        <input type="checkbox" checked={acceptThin} onChange={(e) => setAcceptThin(e.target.checked)} />
        Accept thickening walls under 150 mm
      </label>

      {trimmedOpenings.length ? (
        <p data-testid="lr-floorplan-trimmed-openings" style={{ color: "#8a5a00" }}>
          {trimmedOpenings.length} opening(s) trimmed to host walls — red segments on overlay (before Apply).
        </p>
      ) : null}

      {normalized.issues.length ? (
        <ul data-testid="lr-floorplan-extract-issues">
          {normalized.issues.map((issue, i) => (
            <li key={`${issue.code}-${i}`} style={{ color: issue.blocksApply ? "#b00020" : "#666" }}>
              {issue.blocksApply ? "Block: " : "Note: "}{issue.message}
            </li>
          ))}
        </ul>
      ) : (
        <p>Geometry gates passed — confirm scale before Apply.</p>
      )}

      <footer>
        <button type="button" disabled={busy} onClick={() => void previewGlb()}>
          {busy ? "Exporting…" : "Download GLB preview"}
        </button>
        <button type="button" data-testid="lr-floorplan-extract-apply" disabled={!applyEnabled}
          title={!scaleConfirmed ? "Confirm scale first" : !normalized.canApply ? "Geometry gates blocked" : "Apply"}
          onClick={apply}>
          Apply to project
        </button>
      </footer>
    </div>
  );
}
