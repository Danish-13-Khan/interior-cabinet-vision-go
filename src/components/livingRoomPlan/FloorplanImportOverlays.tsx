import type { InteriorProject } from "../../domain/interiorProject";
import type { PlanFileImportApi } from "../../hooks/usePlanFileImport";
import { FloorplanExtractReview } from "./FloorplanExtractReview";
import { LivingRoomPlanPdfImportSlot } from "./LivingRoomPlanPdfImportSlot";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";

type Props = {
  project: InteriorProject | null;
  roomWidthMm: number;
  planImport: PlanFileImportApi;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onStudioPanel: (panel: "build") => void;
  commitDraft: () => void;
  onImportError: (message: string) => void;
  onPatchDocument: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
    cabinetIds?: string[],
  ) => void;
  onRetryImportWalls: () => void;
};

export function FloorplanImportOverlays(props: Props) {
  const { project, planImport: p } = props;
  const { extractDraft, extractStatus, lastAppliedExtract } = p;
  return (
    <>
      <LivingRoomPlanPdfImportSlot
        file={p.pdfImportFile}
        roomWidthMm={props.roomWidthMm}
        onCancel={() => p.setPdfImportFile(null)}
        onConfirm={(underlay) => {
          p.setPdfImportFile(null);
          props.onSetPlanUnderlay(underlay);
          props.onStudioPanel("build");
          props.commitDraft();
        }}
        onError={(message) => { p.setPdfImportFile(null); props.onImportError(message); }}
      />
      {!extractDraft && lastAppliedExtract && project ? (
        <div className="lr-floorplan-extract-review" style={{ maxHeight: "unset" }}>
          <button
            type="button"
            data-testid="lr-floorplan-reopen-import"
            onClick={() => {
              p.setExtractDraft(lastAppliedExtract);
              p.setExtractLiveSchema({
                state: "structural-fallback",
                message: "Re-opened saved extract — re-run patch/extract to refresh live schema",
              });
              p.setExtractDraftKey((k) => k + 1);
            }}
          >
            Re-open floor plan import
          </button>
        </div>
      ) : null}
      {extractStatus ? (
        <div className="lr-floorplan-extract-review" data-testid="lr-floorplan-extract-status"
          role={extractStatus.loading ? "status" : "alert"} aria-live="polite">
          <strong>{extractStatus.loading ? "Reading drawing into a review draft" : "Wall import did not complete"}</strong>
          <p>{extractStatus.message}</p>
          {!extractStatus.loading ? <>
            <p>No walls have been applied. Tracing underlay is unchanged.</p>
            <button type="button" onClick={props.onRetryImportWalls}>Choose drawing again</button>
            <button type="button" onClick={() => p.setExtractStatus(null)}>Dismiss</button>
          </> : null}
        </div>
      ) : null}
      {extractDraft && project ? (
        <FloorplanExtractReview
          key={p.extractDraftKey}
          draft={extractDraft}
          draftKey={`extract-${p.extractDraftKey}`}
          project={project}
          initialLiveSchema={p.extractLiveSchema ?? undefined}
          onClose={() => { p.setExtractDraft(null); p.setExtractLiveSchema(null); }}
          onApply={(next, appliedDraft, status) => {
            props.onPatchDocument(() => next, status);
            p.setLastAppliedExtract(appliedDraft);
            p.setExtractDraft(null);
            p.setExtractLiveSchema(null);
          }}
          onError={props.onImportError}
        />
      ) : null}
    </>
  );
}
