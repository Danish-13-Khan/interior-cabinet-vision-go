import { useEffect, useMemo, useState } from "react";
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

function armPreviewIfRequested(
  draft: unknown,
  setMode: (mode: FloorplanPreviewMode) => void,
) {
  if (!draft) return;
  if (consumeFloorplanPreviewOnModel()) setMode("preview");
}

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
  const previewOn = mode === "preview" || mode === "both";
  const preview = useFloorplanGlbPreview(draft, previewOn, draftKey);
  const url = preview.status === "ready" ? preview.objectUrl : null;

  // Mount / draft change, and request while already on Model (chrome 3D again).
  useEffect(() => {
    armPreviewIfRequested(draft, setMode);
    return subscribeFloorplanPreviewRequest(() => armPreviewIfRequested(draft, setMode));
  }, [draft, props.project.id, props.project.extensions?.floorplanExtractAppliedAt]);

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
            <span className="lr-floorplan-preview-note"> Preview from floorplan tool</span>
          ) : null}
          {mode === "both" ? (
            <span className="lr-floorplan-preview-note">
              {" "}Origins may not align — two buildings until alignment lands.
            </span>
          ) : null}
          {previewOn && preview.status === "loading" ? <span> Loading preview… (shell until ready)</span> : null}
          {previewOn && preview.status === "error" ? (
            <span> {preview.message} <button type="button" onClick={preview.retry}>Retry</button></span>
          ) : null}
        </div>
      ) : null}
      <LivingRoomModelView
        {...props}
        floorplanPreviewUrl={url}
        floorplanPreviewMode={mode}
      />
    </div>
  );
}
