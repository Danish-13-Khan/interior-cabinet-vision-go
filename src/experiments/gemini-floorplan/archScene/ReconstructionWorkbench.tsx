import type { ArchitecturalScene } from "./archSceneTypes";
import { evaluateReconstructionGate } from "./reconstructionGate";
import { buildPlacementConstraints } from "./placementConstraints";

type Props = {
  scene: ArchitecturalScene | null;
  acceptedIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleAccept: (id: string) => void;
  onLighting: (p: "studio" | "warm" | "cool") => void;
  onSkirting: (mm: number) => void;
};

/** G-14 heatmap + per-entity accept + materials/lighting. */
export function ReconstructionWorkbench({
  scene,
  acceptedIds,
  selectedId,
  onSelect,
  onToggleAccept,
  onLighting,
  onSkirting,
}: Props) {
  if (!scene) {
    return (
      <section className="gfl-panel">
        <header className="gfl-panel__head">
          <h2>Reconstruction gate</h2>
          <p>Load a proposal to evaluate readiness.</p>
        </header>
      </section>
    );
  }
  const gate = evaluateReconstructionGate(scene);
  const constraints = buildPlacementConstraints(scene);
  const usable = constraints.reduce((s, c) => s + c.usableMm, 0);
  const confColor = { low: "#c45c5c", medium: "#c9a227", high: "#5a9e6f" };

  return (
    <section className="gfl-panel" aria-label="Reconstruction workbench">
      <header className="gfl-panel__head">
        <h2>Gate + heatmap</h2>
        <p>
          {gate.pass ? "Pass" : "Blocked"} · L{gate.confidenceSummary.low}/M
          {gate.confidenceSummary.medium}/H{gate.confidenceSummary.high} · usable{" "}
          {Math.round(usable)} mm · accepted {acceptedIds.length}
        </p>
      </header>
      <div className="gfl-geom__toggle">
        {(["studio", "warm", "cool"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={scene.lightingPreset === p ? "is-active" : undefined}
            onClick={() => onLighting(p)}
          >
            {p}
          </button>
        ))}
        <label>
          skirting
          <input
            type="number"
            min={0}
            max={300}
            value={scene.skirtingMm}
            onChange={(e) => onSkirting(Number(e.target.value))}
          />
        </label>
      </div>
      <ul className="gfl-score__list">
        {gate.heatmap.slice(0, 16).map((h) => (
          <li key={h.entityId}>
            <button
              type="button"
              style={{
                border: "none",
                background: "transparent",
                color: confColor[h.confidence],
                cursor: "pointer",
                font: "inherit",
              }}
              onClick={() => onSelect(h.entityId)}
            >
              {h.kind} {h.entityId} · {h.confidence}
              {selectedId === h.entityId ? " ←" : ""}
            </button>{" "}
            <button type="button" onClick={() => onToggleAccept(h.entityId)}>
              {acceptedIds.includes(h.entityId) ? "✓ kept" : "keep"}
            </button>
          </li>
        ))}
        {gate.issues.map((i) => (
          <li key={i.id} className={i.severity === "error" ? "is-fail" : undefined}>
            {i.severity}: {i.message}
          </li>
        ))}
        {gate.issues.length === 0 ? <li className="is-pass">✓ No structural errors</li> : null}
      </ul>
    </section>
  );
}
