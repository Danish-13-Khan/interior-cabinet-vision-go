import type { ArchitecturalScene } from "./archSceneTypes";

type Props = {
  scene: ArchitecturalScene | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, t: number) => void;
  onResize: (id: string, widthMm: number) => void;
  onRehost: (id: string, wallId: string) => void;
  onSwing: (id: string, swing: "left" | "right" | "unknown") => void;
  onInferSwings: () => void;
};

/** G-8.3–8.6 opening review controls. */
export function OpeningEditorPanel({
  scene,
  selectedId,
  onSelect,
  onMove,
  onResize,
  onRehost,
  onSwing,
  onInferSwings,
}: Props) {
  if (!scene) {
    return (
      <section className="gfl-panel">
        <header className="gfl-panel__head">
          <h2>Openings</h2>
          <p>Load a proposal to edit doors/windows.</p>
        </header>
      </section>
    );
  }
  const op =
    scene.openings.find((o) => o.id === selectedId) ?? scene.openings[0] ?? null;

  return (
    <section className="gfl-panel" aria-label="Opening editor">
      <header className="gfl-panel__head">
        <h2>Opening editor</h2>
        <p>
          {scene.openings.length} openings · move / resize / re-host / swing
        </p>
      </header>
      <div className="gfl-geom__toggle">
        <select
          value={op?.id ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          aria-label="Opening"
        >
          {scene.openings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id} · {o.kind}
            </option>
          ))}
        </select>
        <button type="button" onClick={onInferSwings}>
          Infer door swings
        </button>
      </div>
      {op ? (
        <div className="gfl-score__list" style={{ display: "grid", gap: "0.5rem", padding: "0 1rem 1rem" }}>
          <label>
            t {op.t.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={op.t}
              onChange={(e) => onMove(op.id, Number(e.target.value))}
            />
          </label>
          <label>
            width mm
            <input
              type="number"
              value={op.widthMm}
              onChange={(e) => onResize(op.id, Number(e.target.value))}
            />
          </label>
          <label>
            host wall
            <select
              value={op.wallId}
              onChange={(e) => onRehost(op.id, e.target.value)}
            >
              {scene.walls.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id}
                </option>
              ))}
            </select>
          </label>
          {op.kind === "door" ? (
            <div className="gfl-geom__toggle">
              {(["left", "right", "unknown"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={op.swing === s ? "is-active" : undefined}
                  onClick={() => onSwing(op.id, s)}
                >
                  swing {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p style={{ padding: "0 1rem 1rem" }}>No openings in scene.</p>
      )}
    </section>
  );
}
