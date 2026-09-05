import type { GeometryViewMode } from "./geometryMode";

type Props = {
  mode: GeometryViewMode;
  disabled?: boolean;
  busy?: boolean;
  cvNote?: string | null;
  onChange: (mode: GeometryViewMode) => void;
};

export function GeometryModeToggle({ mode, disabled, busy, cvNote, onChange }: Props) {
  return (
    <section className="gfl-panel gfl-geom" aria-label="Geometry cleanup mode">
      <header className="gfl-panel__head">
        <h2>Phase 6 · Geometry</h2>
        <p>Raw Vision, 6A cleanup, or 6B classical CV wall candidates from the plan image.</p>
      </header>
      <div className="gfl-geom__toggle" role="group" aria-label="Geometry view mode">
        <button
          type="button"
          className={mode === "raw" ? "is-active" : undefined}
          disabled={disabled || busy}
          onClick={() => onChange("raw")}
        >
          Raw Vision
        </button>
        <button
          type="button"
          className={mode === "cleaned" ? "is-active" : undefined}
          disabled={disabled || busy}
          onClick={() => onChange("cleaned")}
        >
          6A cleaned
        </button>
        <button
          type="button"
          className={mode === "cv" ? "is-active" : undefined}
          disabled={disabled || busy}
          onClick={() => onChange("cv")}
        >
          {busy ? "CV…" : "6B classical CV"}
        </button>
      </div>
      <p className="gfl-geom__hint">
        {disabled
          ? "Load a fixture or run Vision to enable."
          : mode === "cv"
            ? cvNote ??
              "Classical CV: threshold + axis segments from the image; Vision room names kept. Needs an uploaded plan image."
            : mode === "cleaned"
              ? "Phase 6A ortho snap / merge / close loops on Vision geometry."
              : "Raw Vision extract. Switch modes to compare."}
      </p>
    </section>
  );
}
