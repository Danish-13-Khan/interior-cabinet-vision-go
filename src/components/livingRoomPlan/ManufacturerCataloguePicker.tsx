import { useEffect, useMemo, useState } from "react";
import type { InteriorObjectEntity } from "../../domain/interiorProject";
import {
  listManufacturerCatalogues,
  manufacturerFinishesCompatibleWithSelectionSlot,
} from "../../domain/livingRoom";

type Props = {
  disabled?: boolean;
  /** When set, only finishes compatible with this slot on the selection are listed. */
  selectedObjects?: InteriorObjectEntity[];
  slotName?: string;
  filterForSelection?: boolean;
  onStage: (finishId: string) => void;
};

/** M6.3 — pick a curated manufacturer finish and stage it for preview/apply. */
export function ManufacturerCataloguePicker({
  disabled, selectedObjects = [], slotName = "", filterForSelection = false, onStage,
}: Props) {
  const catalogues = useMemo(() => listManufacturerCatalogues(), []);
  const [catalogueId, setCatalogueId] = useState(catalogues[0]?.id ?? "");
  const catalogue = catalogues.find((item) => item.id === catalogueId) ?? catalogues[0] ?? null;
  const finishes = useMemo(() => {
    const all = catalogue?.finishes ?? [];
    if (!filterForSelection) return [...all];
    return manufacturerFinishesCompatibleWithSelectionSlot(all, selectedObjects, slotName);
  }, [catalogue, filterForSelection, selectedObjects, slotName]);
  const [finishId, setFinishId] = useState(finishes[0]?.id ?? "");
  const activeFinish = finishes.find((item) => item.id === finishId) ?? null;
  const finishMeta = activeFinish && (activeFinish.brand || activeFinish.productCode)
    ? [
      activeFinish.brand,
      activeFinish.productCode,
      activeFinish.sheetWidthMm && activeFinish.sheetHeightMm
        ? `${activeFinish.sheetWidthMm}×${activeFinish.sheetHeightMm} mm`
        : null,
    ].filter(Boolean).join(" · ")
    : null;

  useEffect(() => {
    if (!finishes.some((finish) => finish.id === finishId)) {
      setFinishId(finishes[0]?.id ?? "");
    }
  }, [finishes, finishId]);

  function selectCatalogue(nextId: string) {
    setCatalogueId(nextId);
  }

  return (
    <div className="lr-manufacturer-catalogue" data-testid="manufacturer-catalogue">
      <header>
        <strong>Manufacturer catalogues</strong>
        <span>Curated samples · copied into this project</span>
      </header>
      <label>
        <span>Catalogue</span>
        <select
          data-testid="manufacturer-catalogue-select"
          aria-label="Manufacturer catalogue"
          value={catalogue?.id ?? ""}
          disabled={disabled || catalogues.length === 0}
          onChange={(event) => selectCatalogue(event.target.value)}
        >
          {catalogues.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      {catalogue ? <small>{catalogue.note}</small> : null}
      {finishMeta ? (
        <p className="lr-manufacturer-finish-meta" data-testid="manufacturer-finish-meta">{finishMeta}</p>
      ) : null}
      <label>
        <span>Finish</span>
        <select
          data-testid="manufacturer-finish-select"
          aria-label="Catalogue finish"
          value={finishId}
          disabled={disabled || finishes.length === 0}
          onChange={(event) => setFinishId(event.target.value)}
        >
          {finishes.map((finish) => (
            <option key={finish.id} value={finish.id}>{finish.name}</option>
          ))}
        </select>
      </label>
      {filterForSelection && finishes.length === 0 ? (
        <p data-testid="manufacturer-finish-empty">No catalogue finishes match this material slot.</p>
      ) : null}
      <button
        type="button"
        data-testid="manufacturer-finish-stage"
        disabled={disabled || !finishId}
        onClick={() => onStage(finishId)}
      >
        Preview finish
      </button>
    </div>
  );
}
