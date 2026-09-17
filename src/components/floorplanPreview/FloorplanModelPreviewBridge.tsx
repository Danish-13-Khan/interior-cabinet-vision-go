import { useCallback, useEffect, useMemo, useState } from "react";
import {
  floorplanShellStaleSinceApply,
  normalizeExtraction,
  reapplyFloorplanExtract,
  recordFloorplanTelemetry,
  FLOORPLAN_PREVIEW_OWNERSHIP_NOTE,
  FLOORPLAN_STALE_OWNERSHIP_NOTE,
} from "../../domain/floorplanExtract";
import { LivingRoomModelView, type LivingRoomModelViewProps } from "../LivingRoomModelView";
import { useFloorplanGlbPreview } from "../../hooks/useFloorplanGlbPreview";
import {
  FLOORPLAN_PREVIEW_MODE_LABELS,
  type FloorplanPreviewMode,
} from "./floorplanPreviewMode";
import { readSavedFloorplanDraft } from "./readSavedFloorplanDraft";
import { floorplanDraftContentKey } from "./floorplanDraftKey";
import {
  consumeFloorplanPreviewOnModel,
  peekFloorplanPreviewOnModel,
  subscribeFloorplanPreviewRequest,
} from "./floorplanPreviewPreference";
import { FloorplanPreviewStaleBar } from "./FloorplanPreviewStaleBar";

function armPreviewIfRequested(
  draft: unknown,
  setMode: (mode: FloorplanPreviewMode) => void,
) {
  if (!draft) return;
  if (consumeFloorplanPreviewOnModel()) setMode("preview");
}

const STALE_MESSAGES = {
  diverged: "Editable shell changed since preview source was applied",
  legacy_snapshot: "Prior Apply snapshot is ID-only — preview freshness unknown",
} as const;

/** Wraps Model View so Studio can render FloorplanPreviewMesh with the same cache leases. */
export function FloorplanModelPreviewBridge(props: LivingRoomModelViewProps) {
  const draft = useMemo(
    () => readSavedFloorplanDraft(props.project.extensions?.floorplanExtractDraft),
    [props.project.extensions?.floorplanExtractDraft],
  );
  const draftKey = draft
    ? floorplanDraftContentKey(
      draft,
      props.project.extensions?.floorplanExtractAppliedAt,
      props.project.id,
    )
    : props.project.id;
  const [mode, setMode] = useState<FloorplanPreviewMode>(() =>
    draft && peekFloorplanPreviewOnModel() ? "preview" : "editable",
  );
  const [reapplying, setReapplying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const previewOn = mode === "preview" || mode === "both";
  const preview = useFloorplanGlbPreview(draft, previewOn, draftKey);
  const url =
    preview.status === "ready" || preview.status === "loading" || preview.status === "error"
      ? preview.objectUrl ?? null
      : null;
  const staleState = useMemo(
    () => (draft ? floorplanShellStaleSinceApply(props.project) : { stale: false as const }),
    [draft, props.project],
  );
  const reapplyGate = useMemo(() => {
    if (!draft) return { ok: false, title: "No saved extract" };
    const normalized = normalizeExtraction(draft, { acceptThinWalls: true });
    if (!normalized.canApply) {
      const block = normalized.issues.find((i) => i.blocksApply);
      return { ok: false, title: block?.message ?? "Extract gates block Re-apply" };
    }
    return {
      ok: true,
      title: "Replace walls/openings/rooms from the saved extract; clears objects and surfaces.",
    };
  }, [draft]);

  useEffect(() => {
    armPreviewIfRequested(draft, setMode);
    return subscribeFloorplanPreviewRequest(() => armPreviewIfRequested(draft, setMode));
  }, [draft, props.project.id, props.project.extensions?.floorplanExtractAppliedAt]);

  const onRefreshSourcePreview = useCallback(() => {
    setActionError(null);
    recordFloorplanTelemetry({ type: "refresh_source_preview" });
    if (mode === "editable") setMode("preview");
    preview.retry();
  }, [preview, mode]);

  const onReapplyExtract = useCallback(() => {
    if (!draft || !props.onPatchDocument) return;
    const ok = window.confirm(
      "Re-apply extract will replace walls, openings, and rooms from the saved floor plan, "
      + "and clear placed objects and surface zones. Continue?",
    );
    if (!ok) {
      recordFloorplanTelemetry({ type: "reapply_extract", outcome: "cancelled" });
      return;
    }
    setReapplying(true);
    setActionError(null);
    try {
      const next = reapplyFloorplanExtract(props.project, draft, true);
      props.onPatchDocument(() => next, "Re-applied floor plan extract (shell reset).");
      recordFloorplanTelemetry({ type: "reapply_extract", outcome: "ok" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Re-apply failed.";
      setActionError(message);
      recordFloorplanTelemetry({ type: "reapply_extract", outcome: "error", message });
    } finally {
      setReapplying(false);
    }
  }, [draft, props.onPatchDocument, props.project]);

  return (
    <div className="lr-floorplan-model-preview-bridge">
      {draft ? (
        <div className="lr-floorplan-preview-toggle" data-testid="lr-floorplan-preview-toggle">
          <label>
            Shell / mesh{" "}
            <select
              value={mode}
              aria-label="Floorplan shell versus preview mesh"
              onChange={(e) => setMode(e.target.value as FloorplanPreviewMode)}
            >
              {(Object.keys(FLOORPLAN_PREVIEW_MODE_LABELS) as FloorplanPreviewMode[]).map((id) => (
                <option key={id} value={id}>{FLOORPLAN_PREVIEW_MODE_LABELS[id]}</option>
              ))}
            </select>
          </label>
          {mode === "preview" ? (
            <span className="lr-floorplan-preview-note"> {FLOORPLAN_PREVIEW_OWNERSHIP_NOTE}</span>
          ) : null}
          {mode === "both" ? (
            <span className="lr-floorplan-preview-note">
              {" "}Origins may not align — two buildings until alignment lands.
            </span>
          ) : null}
          {previewOn && preview.status === "loading" && !preview.objectUrl ? (
            <span> Loading preview… (shell until ready)</span>
          ) : null}
          {previewOn && preview.status === "loading" && preview.objectUrl ? (
            <span> Refreshing preview…</span>
          ) : null}
          {previewOn && preview.status === "error" ? (
            <span> {preview.message} <button type="button" onClick={preview.retry}>Retry</button></span>
          ) : null}
        </div>
      ) : null}
      {staleState.stale && draft ? (
        <>
          <FloorplanPreviewStaleBar
            message={STALE_MESSAGES[staleState.reason]}
            refreshing={preview.status === "loading"}
            reapplying={reapplying}
            onRefreshSourcePreview={onRefreshSourcePreview}
            onReapplyExtract={onReapplyExtract}
            reapplyDisabled={!reapplyGate.ok || !props.onPatchDocument}
            reapplyTitle={reapplyGate.title}
          />
          <p className="lr-floorplan-preview-note">{FLOORPLAN_STALE_OWNERSHIP_NOTE}</p>
        </>
      ) : null}
      {actionError ? <p className="lr-floorplan-preview-note" role="alert">{actionError}</p> : null}
      <LivingRoomModelView
        {...props}
        floorplanPreviewUrl={url}
        floorplanPreviewMode={mode}
      />
    </div>
  );
}
