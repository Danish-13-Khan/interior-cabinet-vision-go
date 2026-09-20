import { useEffect, useMemo, useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  applyFloorplanToInterior,
  ensureCollisionFreeIds,
  markScaleCalibrated,
  normalizeExtraction,
  patchFloorplanGeometry,
  applyImpactKey,
  resolveScaleTrust,
  scaleTrustAllowsApply,
  summarizeFloorplanApplyImpact,
  type ExtractionResult,
  type LiveSchemaStatus,
  type NormalizedFloorplan,
  type PolygonGroup,
} from "../../domain/floorplanExtract";
import { FloorplanExtractOverlay } from "./FloorplanExtractOverlay";
import { FloorplanExtractCalibrate } from "./FloorplanExtractCalibrate";
import { FloorplanExtractApplyGate, canPassApplyGate } from "./FloorplanExtractApplyGate";
import { FloorplanExtractReviewFooter } from "./FloorplanExtractReviewFooter";
import { FloorplanExtractReviewIssues } from "./FloorplanExtractReviewIssues";

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
  const [acceptThin, setAcceptThin] = useState(false);
  const [replaceAck, setReplaceAck] = useState(false);
  const [schemaFallbackAck, setSchemaFallbackAck] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setWorkingDraft(ensureCollisionFreeIds(props.draft));
    setLiveSchema(props.initialLiveSchema ?? { state: "structural-fallback", message: "Schema status unknown" });
    setAcceptThin(false);
    setReplaceAck(false);
    setSchemaFallbackAck(false);
    setBusy(false);
  }, [props.draftKey, props.draft, props.initialLiveSchema]);

  const normalized: NormalizedFloorplan = useMemo(
    () => normalizeExtraction(workingDraft, { acceptThinWalls: acceptThin }),
    [workingDraft, acceptThin],
  );
  const impact = useMemo(() => summarizeFloorplanApplyImpact(props.project), [props.project]);
  const impactKey = applyImpactKey(props.project, impact);
  useEffect(() => { setReplaceAck(false); }, [impactKey]);
  const trust = resolveScaleTrust(workingDraft);
  const gateOk = canPassApplyGate({ impact, liveSchema, replaceAck, schemaFallbackAck });
  const applyEnabled = normalized.canApply && scaleTrustAllowsApply(trust) && gateOk;

  const runPatch = async (
    ops: Parameters<typeof patchFloorplanGeometry>[1],
    stamp?: (draft: ExtractionResult) => ExtractionResult,
  ) => {
    setBusy(true);
    try {
      const ingest = await patchFloorplanGeometry(ensureCollisionFreeIds(workingDraft), ops);
      const next = stamp ? stamp(ingest.draft) : ingest.draft;
      setWorkingDraft(ensureCollisionFreeIds(next));
      setLiveSchema(ingest.liveSchema);
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
    <div className="lr-floorplan-extract-review" data-testid="lr-floorplan-extract-review" role="dialog" aria-label="Review import draft">
      <header>
        <strong>Review import draft</strong>
        <button type="button" onClick={props.onClose} disabled={busy}>Close</button>
      </header>

      <FloorplanExtractOverlay draft={workingDraft} normalized={normalized} />

      <FloorplanExtractCalibrate
        pixelScale={workingDraft.pixel_scale}
        busy={busy}
        onApplyRefLength={(refLengthM, refLengthPx) => {
          void runPatch(
            [{ kind: "set_scale", pixel_scale: refLengthM / refLengthPx, rescale_coords: true }],
            (draft) => markScaleCalibrated(draft, { referenceLengthMm: refLengthM * 1000 }),
          );
        }}
        onApplyPixelScale={(pixelScale, rescaleCoords) => {
          void runPatch(
            [{ kind: "set_scale", pixel_scale: pixelScale, rescale_coords: rescaleCoords }],
            (draft) => markScaleCalibrated(draft, { source: "user_pixel_scale" }),
          );
        }}
      />

      <FloorplanExtractReviewIssues
        draft={workingDraft} trust={trust} normalized={normalized}
        acceptThin={acceptThin} busy={busy} onAcceptThin={setAcceptThin}
      />

      <FloorplanExtractApplyGate
        impact={impact} liveSchema={liveSchema}
        replaceAck={replaceAck} schemaFallbackAck={schemaFallbackAck}
        onReplaceAck={setReplaceAck} onSchemaFallbackAck={setSchemaFallbackAck}
      />

      <FloorplanExtractReviewFooter
        draft={workingDraft} busy={busy} applyEnabled={applyEnabled}
        onError={props.onError} onBusy={setBusy} onApply={apply}
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
    </div>
  );
}
