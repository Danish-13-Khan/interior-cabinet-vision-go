import type { FinishImportDraft } from "../../domain/livingRoom";
import type { InteriorObjectEntity } from "../../domain/interiorProject";
import { FinishImportPreviewPanel } from "./FinishImportPreviewPanel";
import { FinishImportUrlField } from "./FinishImportUrlField";
import { ManufacturerCataloguePicker } from "./ManufacturerCataloguePicker";

type Props = {
  draft: FinishImportDraft | null;
  importError: string | null;
  urlBusy: boolean;
  selectedObjects?: InteriorObjectEntity[];
  slotName?: string;
  filterCatalogueForSelection?: boolean;
  onStageUrl: (url: string) => void;
  onStageCatalogue: (finishId: string) => void;
  onChangeDraft: (patch: Partial<FinishImportDraft>) => void;
  onApply: () => void;
  onCancel: () => void;
};

/** M4–M6 import chrome: catalogues, URL fetch, preview, errors. */
export function FinishImportExtras({
  draft, importError, urlBusy, selectedObjects, slotName, filterCatalogueForSelection,
  onStageUrl, onStageCatalogue, onChangeDraft, onApply, onCancel,
}: Props) {
  return (
    <>
      <ManufacturerCataloguePicker
        disabled={urlBusy}
        selectedObjects={selectedObjects}
        slotName={slotName}
        filterForSelection={filterCatalogueForSelection}
        onStage={onStageCatalogue}
      />
      <FinishImportUrlField busy={urlBusy} onSubmit={onStageUrl} />
      {draft && !urlBusy ? (
        <FinishImportPreviewPanel
          draft={draft}
          error={importError}
          onChange={onChangeDraft}
          onApply={onApply}
          onCancel={onCancel}
        />
      ) : null}
      {urlBusy ? (
        <p className="lr-finish-import-busy" data-testid="finish-import-busy">Fetching texture…</p>
      ) : null}
      {!draft && importError ? (
        <p className="lr-finish-import-error" data-testid="finish-import-error" role="alert">{importError}</p>
      ) : null}
    </>
  );
}
