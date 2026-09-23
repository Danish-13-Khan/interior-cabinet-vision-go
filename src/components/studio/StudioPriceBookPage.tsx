import { usePriceBook } from "../../hooks/usePriceBook";

export function StudioPriceBookPage() {
  const { priceBook, canEdit, save, resetToDefaults } = usePriceBook();
  return (
    <div className="studio-page" data-testid="studio-price-book">
      <h2>Price book</h2>
      <p>Personal rates used by the existing quote engine. Frozen proposals keep their issued values.</p>
      {!canEdit ? <p className="studio-state is-error">A paid plan is required to edit rates.</p> : null}
      <fieldset className="studio-card" disabled={!canEdit}>
        <legend>Boards · per m²</legend>
        {priceBook.boards.map((row, index) => (
          <label className="studio-field" key={`${row.materialId}:${row.thicknessMm}`}>
            {row.materialId} · {row.thicknessMm} mm
            <input
              type="number"
              min={0}
              value={row.costPerM2}
              onChange={(event) => save({
                boards: priceBook.boards.map((item, itemIndex) => itemIndex === index
                  ? { ...item, costPerM2: Number(event.target.value) }
                  : item),
              })}
            />
          </label>
        ))}
      </fieldset>
      <fieldset className="studio-card" disabled={!canEdit}>
        <legend>Quote defaults</legend>
        {Object.entries(priceBook.quoteDefaults).map(([key, value]) => (
          <label className="studio-field" key={key}>
            {key}
            <input
              type="number"
              min={0}
              value={value}
              onChange={(event) => save({
                quoteDefaults: { ...priceBook.quoteDefaults, [key]: Number(event.target.value) },
              })}
            />
          </label>
        ))}
      </fieldset>
      <button type="button" className="studio-btn" onClick={resetToDefaults} disabled={!canEdit}>Reset to defaults</button>
    </div>
  );
}
