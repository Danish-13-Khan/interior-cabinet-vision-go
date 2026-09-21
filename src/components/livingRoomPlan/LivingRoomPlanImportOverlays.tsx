import type { ExtractionResult, LiveSchemaStatus } from "../../domain/floorplanExtract";
import type { InteriorProject } from "../../domain/interiorProject";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import type { ExtractStatus } from "../../hooks/useWorkspacePlanImport";
import { FloorplanExtractReview } from "./FloorplanExtractReview";
import { LivingRoomPlanDwgImportSlot } from "./LivingRoomPlanDwgImportSlot";
import { LivingRoomPlanPdfImportSlot } from "./LivingRoomPlanPdfImportSlot";

type LivingRoomPlanImportOverlaysProps = {
  project: InteriorProject | null;
  roomWidthMm: number;
  dwgFile: File | null;
  pdfFile: File | null;
  extractDraft: ExtractionResult | null;
  extractDraftKey: number;
  extractLiveSchema: LiveSchemaStatus | null;
  extractStatus: ExtractStatus | null;
  lastAppliedExtract: ExtractionResult | null;
  underlayPicker: (() => void) | null;
  onCancelDwg: () => void;
  onConfirmDwg: (underlay: LivingRoomPlanUnderlay) => void;
  onCancelPdf: () => void;
  onConfirmPdf: (underlay: LivingRoomPlanUnderlay) => void;
  onPdfError: (message: string) => void;
  onReopenExtract: () => void;
  onDismissExtractStatus: () => void;
  onCloseExtract: () => void;
  onApplyExtract: (next: InteriorProject, draft: ExtractionResult, status: string) => void;
  onImportError: (message: string) => void;
};

export function LivingRoomPlanImportOverlays(props: LivingRoomPlanImportOverlaysProps) {
  return (
    <>
      <LivingRoomPlanDwgImportSlot
        file={props.dwgFile}
        onCancel={props.onCancelDwg}
        onConfirm={props.onConfirmDwg}
      />
      <LivingRoomPlanPdfImportSlot
        file={props.pdfFile}
        roomWidthMm={props.roomWidthMm}
        onCancel={props.onCancelPdf}
        onConfirm={props.onConfirmPdf}
        onError={props.onPdfError}
      />
      {!props.extractDraft && props.lastAppliedExtract && props.project ? (
        <div className="lr-floorplan-reopen">
          <button type="button" data-testid="lr-floorplan-reopen-import" onClick={props.onReopenExtract}>
            Re-open floor plan import
          </button>
        </div>
      ) : null}
      {props.extractStatus ? (
        <div
          className="lr-floorplan-extract-review"
          data-testid="lr-floorplan-extract-status"
          role={props.extractStatus.loading ? "status" : "alert"}
          aria-live="polite"
        >
          <strong>{props.extractStatus.loading ? "Generating 3D from your plan" : "3D generation did not complete"}</strong>
          <p>{props.extractStatus.message}</p>
          {!props.extractStatus.loading ? (
            <>
              <p>Your plan image is still available for tracing. No generated geometry has been applied.</p>
              <button type="button" onClick={() => props.underlayPicker?.()}>Choose plan again</button>
              <button type="button" onClick={props.onDismissExtractStatus}>Dismiss</button>
            </>
          ) : null}
        </div>
      ) : null}
      {props.extractDraft && props.project ? (
        <FloorplanExtractReview
          key={props.extractDraftKey}
          draft={props.extractDraft}
          draftKey={`extract-${props.extractDraftKey}`}
          project={props.project}
          initialLiveSchema={props.extractLiveSchema ?? undefined}
          onClose={props.onCloseExtract}
          onApply={props.onApplyExtract}
          onError={props.onImportError}
        />
      ) : null}
    </>
  );
}
