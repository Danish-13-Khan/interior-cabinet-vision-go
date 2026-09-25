import type { FinishImportDraft } from "../../domain/livingRoom";
import { FinishUvFields } from "./FinishUvFields";
import { finishImportPreviewLayerStyle } from "./finishImportPreviewStyle";

type Props = {
  draft: FinishImportDraft;
  error?: string | null;
  applyLabel?: string;
  onChange: (patch: Partial<Omit<FinishImportDraft, "fileName" | "dataUrl">>) => void;
  onApply: () => void;
  onCancel: () => void;
};

/** M4 — preview local texture and UV transforms before committing into the project. */
export function FinishImportPreviewPanel({ draft, error, applyLabel = "Apply texture", onChange, onApply, onCancel }: Props) {
  return (
    <section className="lr-finish-import-preview" data-testid="finish-import-preview" aria-label="Texture import preview">
      <header>
        <strong>Previewing — not applied</strong>
        <span>{draft.fileName}</span>
      </header>
      <p data-testid="finish-preview-note">This catalogue preview is not the room finish until you confirm.</p>
      <div className="lr-finish-import-preview-frame">
        <div
          className="lr-finish-import-preview-layer"
          data-testid="finish-import-preview-layer"
          style={finishImportPreviewLayerStyle(draft)}
          role="img"
          aria-label={`Preview of ${draft.fileName}`}
        />
      </div>
      <FinishUvFields
        values={{
          uvScaleMm: draft.uvScaleMm,
          uvRotationDeg: draft.uvRotationDeg,
          uvOffsetU: draft.uvOffsetU,
          uvOffsetV: draft.uvOffsetV,
        }}
        onChange={onChange}
      />
      {error ? <p className="lr-finish-import-error" data-testid="finish-import-error" role="alert">{error}</p> : null}
      <div className="lr-finish-import-actions">
        <button type="button" data-testid="finish-import-apply" onClick={onApply}>{applyLabel}</button>
        <button type="button" data-testid="finish-import-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </section>
  );
}
