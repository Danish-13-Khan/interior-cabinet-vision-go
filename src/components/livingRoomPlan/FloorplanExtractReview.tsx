import { useEffect, useMemo, useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  applyFloorplanToInterior,
  ensureCollisionFreeIds,
  exportFloorplanBuilding,
  exportFloorplanGlb,
  normalizeExtraction,
  patchFloorplanGeometry,
  wrapSingleFloorBuilding,
  type ExtractionResult,
  type NormalizedFloorplan,
  type PolygonGroup,
} from "../../domain/floorplanExtract";
import { FloorplanExtractOverlay } from "./FloorplanExtractOverlay";
import { FloorplanExtractCalibrate } from "./FloorplanExtractCalibrate";
import { FloorplanExtractPatchPanel } from "./FloorplanExtractPatchPanel";

type Props = {
  draft: ExtractionResult;
  draftKey: string;
  project: InteriorProject;
  onClose: () => void;
  onApply: (next: InteriorProject, appliedDraft: ExtractionResult, status: string) => void;
  onError: (message: string) => void;
};

export function FloorplanExtractReview(props: Props) {
  const [workingDraft, setWorkingDraft] = useState(() => ensureCollisionFreeIds(props.draft));
  const [acceptThin, setAcceptThin] = useState(false);
  const [scaleConfirmed, setScaleConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setWorkingDraft(ensureCollisionFreeIds(props.draft));
    setAcceptThin(false);
    setScaleConfirmed(false);
    setBusy(false);
  }, [props.draftKey, props.draft]);

  const normalized: NormalizedFloorplan = useMemo(
    () => normalizeExtraction(workingDraft, { acceptThinWalls: acceptThin }),
    [workingDraft, acceptThin],
  );
  const applyEnabled = normalized.canApply && scaleConfirmed;
  const trimmedOpenings = Object.entries(normalized.openingAttachments)
    .filter(([, a]) => a.status === "matched" && a.trimmed);

  const runPatch = async (ops: Parameters<typeof patchFloorplanGeometry>[1]) => {
    setBusy(true);
    try {
      const next = await patchFloorplanGeometry(ensureCollisionFreeIds(workingDraft), ops);
      setWorkingDraft(ensureCollisionFreeIds(next));
      setScaleConfirmed(false);
    } catch (error) {
      props.onError(error instanceof Error ? error.message : "Patch failed.");
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!applyEnabled) return;
    try {
      const next = applyFloorplanToInterior(props.project, normalized);
      props.onApply(next, workingDraft, "Applied floor plan topology.");
      props.onClose();
    } catch (error) {
      props.onError(error instanceof Error ? error.message : "Apply failed.");
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const previewGlb = async () => {
    setBusy(true);
    try {
      downloadBlob(await exportFloorplanGlb(normalized.draft), "floorplan-preview.glb");
    } catch (error) {
      props.onError(error instanceof Error ? error.message : "GLB export failed.");
    } finally {
      setBusy(false);
    }
  };

  const previewBuilding = async () => {
    setBusy(true);
    try {
      const building = wrapSingleFloorBuilding(normalized.draft);
      downloadBlob(await exportFloorplanBuilding(building, "stack"), "floorplan-building.glb");
    } catch (error) {
      props.onError(error instanceof Error ? error.message : "Building export failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lr-floorplan-extract-review" data-testid="lr-floorplan-extract-review" role="dialog" aria-label="Floor plan extract review">
      <header>
        <strong>Floor plan → 3D</strong>
        <button type="button" onClick={props.onClose} disabled={busy}>Close</button>
      </header>

      <FloorplanExtractOverlay draft={workingDraft} normalized={normalized} />

      <FloorplanExtractCalibrate
        pixelScale={workingDraft.pixel_scale}
        busy={busy}
        onApplyRefLength={(refLengthM, refLengthPx) => {
          void runPatch([{ kind: "set_scale", pixel_scale: refLengthM / refLengthPx, rescale_coords: true }]);
        }}
        onApplyPixelScale={(pixelScale, rescaleCoords) => {
          void runPatch([{ kind: "set_scale", pixel_scale: pixelScale, rescale_coords: rescaleCoords }]);
        }}
      />

      <FloorplanExtractPatchPanel
        draft={workingDraft}
        busy={busy}
        onDelete={(group, id) => { void runPatch([{ kind: "delete_polygon", group, id }]); }}
        onUpsertJson={(group: PolygonGroup, polygonJson) => {
          try {
            const polygon = JSON.parse(polygonJson) as unknown;
            void runPatch([{ kind: "upsert_polygon", group, polygon }]);
          } catch {
            props.onError("Polygon JSON is invalid.");
          }
        }}
        onSetWallHeight={(heightM) => {
          void runPatch([{ kind: "set_defaults", defaults: { wall_height_m: heightM } }]);
        }}
      />

      <label>
        <input type="checkbox" data-testid="lr-floorplan-scale-confirmed"
          checked={scaleConfirmed} disabled={busy}
          onChange={(e) => setScaleConfirmed(e.target.checked)} />
        I confirmed scale against the underlay / known dimension
      </label>
      <label>
        <input type="checkbox" checked={acceptThin} disabled={busy}
          onChange={(e) => setAcceptThin(e.target.checked)} />
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
        <button type="button" disabled={busy} onClick={() => void previewBuilding()}>
          Download building GLB
        </button>
        <button type="button" data-testid="lr-floorplan-extract-apply" disabled={!applyEnabled || busy}
          title={!scaleConfirmed ? "Confirm scale first" : !normalized.canApply ? "Geometry gates blocked" : "Apply"}
          onClick={apply}>
          Apply to project
        </button>
      </footer>
    </div>
  );
}
