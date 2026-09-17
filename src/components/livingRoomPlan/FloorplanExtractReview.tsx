import { useEffect, useMemo, useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  applyFloorplanToInterior,
  ensureCollisionFreeIds,
  normalizeExtraction,
  patchFloorplanGeometry,
  applyImpactKey,
  summarizeFloorplanApplyImpact,
  type ExtractionResult,
  type LiveSchemaStatus,
  type NormalizedFloorplan,
  type PolygonGroup,
} from "../../domain/floorplanExtract";
import { FloorplanExtractGlbPanel } from "./FloorplanExtractGlbPanel";
import { floorplanDraftHash } from "../floorplanPreview/floorplanDraftKey";
import { FloorplanExtractOverlay } from "./FloorplanExtractOverlay";
import { FloorplanExtractCalibrate } from "./FloorplanExtractCalibrate";
import { FloorplanExtractPatchPanel } from "./FloorplanExtractPatchPanel";
import { FloorplanExtractApplyGate, canPassApplyGate } from "./FloorplanExtractApplyGate";

type Props = {
  draft: ExtractionResult;
  draftKey: string;
  project: InteriorProject;
  initialLiveSchema?: LiveSchemaStatus;
  onClose: () => void;
  onApply: (next: InteriorProject, appliedDraft: ExtractionResult, status: string) => void;
  onError: (message: string) => void;
};

export function FloorplanExtractReview(props: Props) {
  const [workingDraft, setWorkingDraft] = useState(() => ensureCollisionFreeIds(props.draft));
  const [liveSchema, setLiveSchema] = useState<LiveSchemaStatus>(
    props.initialLiveSchema ?? { state: "structural-fallback", message: "Schema status unknown" },
  );
  const [acceptThin, setAcceptThin] = useState(true);
  const [scaleConfirmed, setScaleConfirmed] = useState(false);
  const [replaceAck, setReplaceAck] = useState(false);
  const [schemaFallbackAck, setSchemaFallbackAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setWorkingDraft(ensureCollisionFreeIds(props.draft));
    setLiveSchema(props.initialLiveSchema ?? { state: "structural-fallback", message: "Schema status unknown" });
    setAcceptThin(true);
    setScaleConfirmed(false);
    setReplaceAck(false);
    setSchemaFallbackAck(false);
    setBusy(false);
    setPreviewOpen(false);
  }, [props.draftKey, props.draft, props.initialLiveSchema]);

  const normalized: NormalizedFloorplan = useMemo(
    () => normalizeExtraction(workingDraft, { acceptThinWalls: acceptThin }),
    [workingDraft, acceptThin],
  );
  const impact = useMemo(() => summarizeFloorplanApplyImpact(props.project), [props.project]);
  const impactKey = applyImpactKey(props.project, impact);
  useEffect(() => {
    setReplaceAck(false);
  }, [impactKey]);
  const gateOk = canPassApplyGate({ impact, liveSchema, replaceAck, schemaFallbackAck });
  const applyEnabled = normalized.canApply && scaleConfirmed && gateOk;
  const previewDraftKey = useMemo(
    () => `${props.draftKey}:${floorplanDraftHash(normalized.draft)}`,
    [props.draftKey, normalized.draft],
  );
  const trimmedOpenings = Object.entries(normalized.openingAttachments)
    .filter(([, a]) => a.status === "matched" && a.trimmed);

  const runPatch = async (ops: Parameters<typeof patchFloorplanGeometry>[1]) => {
    setBusy(true);
    try {
      const ingest = await patchFloorplanGeometry(ensureCollisionFreeIds(workingDraft), ops);
      setWorkingDraft(ensureCollisionFreeIds(ingest.draft));
      setLiveSchema(ingest.liveSchema);
      setScaleConfirmed(false);
      setSchemaFallbackAck(false);
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
      props.onApply(next, workingDraft, "Applied floor plan topology (shell replacement).");
      props.onClose();
    } catch (error) {
      props.onError(error instanceof Error ? error.message : "Apply failed.");
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
            void runPatch([{ kind: "upsert_polygon", group, polygon: JSON.parse(polygonJson) as unknown }]);
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

      <FloorplanExtractApplyGate
        impact={impact}
        liveSchema={liveSchema}
        replaceAck={replaceAck}
        schemaFallbackAck={schemaFallbackAck}
        onReplaceAck={setReplaceAck}
        onSchemaFallbackAck={setSchemaFallbackAck}
      />

      {trimmedOpenings.length ? (
        <p data-testid="lr-floorplan-trimmed-openings" style={{ color: "#8a5a00" }}>
          {trimmedOpenings.length} opening(s) trimmed to host walls — red segments on overlay (before Apply).
        </p>
      ) : null}

      {!previewOpen ? (
        normalized.issues.length ? (
          <ul data-testid="lr-floorplan-extract-issues">
            {normalized.issues.map((issue, i) => (
              <li key={`${issue.code}-${i}`} style={{ color: issue.blocksApply ? "#b00020" : "#666" }}>
                {issue.blocksApply ? "Block: " : "Note: "}{issue.message}
              </li>
            ))}
          </ul>
        ) : (
          <p>Geometry gates passed.</p>
        )
      ) : null}

      <FloorplanExtractGlbPanel
        draft={normalized.draft}
        draftKey={previewDraftKey}
        busy={busy}
        setBusy={setBusy}
        onError={props.onError}
        issues={normalized.issues}
        onPreviewOpenChange={setPreviewOpen}
      />

      <footer>
        <button type="button" data-testid="lr-floorplan-extract-apply" disabled={!applyEnabled || busy}
          title={!applyEnabled ? "Confirm scale and Apply gates" : "Apply shell replacement"}
          onClick={apply}>
          Apply to project (replace shell)
        </button>
      </footer>
    </div>
  );
}
