import type { GeometryViewMode } from "./geometryMode";

type Props = {
  mode: GeometryViewMode;
  disabled?: boolean;
  busy?: boolean;
  cvNote?: string | null;
  onChange: (mode: GeometryViewMode) => void;
};

const HINTS: Record<GeometryViewMode, string> = {
  raw: "Raw Vision extract. Switch modes to compare.",
  cleaned: "Phase 6A ortho snap / merge / close loops on Vision geometry.",
  cv: "Classical CV: threshold + axis segments from the image; Vision labels kept.",
  model:
    "CubiCasa-class model JSON → walls; Vision labels kept. Uses offline fixtures or local spike export (research / NC license).",
};

export function GeometryModeToggle({ mode, disabled, busy, cvNote, onChange }: Props) {
  return (
    <section className="gfl-panel gfl-geom" aria-label="Geometry cleanup mode">
      <header className="gfl-panel__head">
        <h2>Phase 6 · Geometry</h2>
        <p>Raw · 6A cleaned · 6B classical CV · 6C CubiCasa-class model (fixtures / local spike).</p>
      </header>
      <div className="gfl-geom__toggle" role="group" aria-label="Geometry view mode">
        {(
          [
            ["raw", "Raw Vision"],
            ["cleaned", "6A cleaned"],
            ["cv", "6B classical CV"],
            ["model", "6C model"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={mode === id ? "is-active" : undefined}
            disabled={disabled || busy}
            onClick={() => onChange(id)}
          >
            {busy && mode === id ? "…" : label}
          </button>
        ))}
      </div>
      <p className="gfl-geom__hint">
        {disabled ? "Load a fixture or run Vision to enable." : cvNote && (mode === "cv" || mode === "model") ? cvNote : HINTS[mode]}
      </p>
    </section>
  );
}
