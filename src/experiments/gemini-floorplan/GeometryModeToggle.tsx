import type { GeometryViewMode } from "./cleanProposalGeometry";

type Props = {
  mode: GeometryViewMode;
  disabled?: boolean;
  onChange: (mode: GeometryViewMode) => void;
};

export function GeometryModeToggle({ mode, disabled, onChange }: Props) {
  return (
    <section className="gfl-panel gfl-geom" aria-label="Geometry cleanup mode">
      <header className="gfl-panel__head">
        <h2>Phase 6A · Geometry</h2>
        <p>Compare raw Vision walls vs free CV cleanup (ortho / merge / close loops).</p>
      </header>
      <div className="gfl-geom__toggle" role="group" aria-label="Geometry view mode">
        <button
          type="button"
          className={mode === "raw" ? "is-active" : undefined}
          disabled={disabled}
          onClick={() => onChange("raw")}
        >
          Raw Vision
        </button>
        <button
          type="button"
          className={mode === "cleaned" ? "is-active" : undefined}
          disabled={disabled}
          onClick={() => onChange("cleaned")}
        >
          CV-cleaned
        </button>
      </div>
      <p className="gfl-geom__hint">
        {disabled
          ? "Load a fixture or run Vision to enable."
          : mode === "cleaned"
            ? "Showing cleaned geometry. Switching modes resets the active proposal from the source extract."
            : "Showing raw extract. Switch to CV-cleaned to apply Phase 6A post-process."}
      </p>
    </section>
  );
}
