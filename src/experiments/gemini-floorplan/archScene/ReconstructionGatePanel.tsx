import type { ArchitecturalScene } from "./archSceneTypes";
import { cabinetWallSpans } from "./cabinetMapping";
import { evaluateReconstructionGate } from "./reconstructionGate";

type Props = { scene: ArchitecturalScene | null };

export function ReconstructionGatePanel({ scene }: Props) {
  if (!scene) {
    return (
      <section className="gfl-panel" aria-label="Reconstruction gate">
        <header className="gfl-panel__head">
          <h2>Phase 14 · Gate</h2>
          <p>Load a proposal to evaluate reconstruction readiness.</p>
        </header>
      </section>
    );
  }
  const gate = evaluateReconstructionGate(scene);
  const spans = cabinetWallSpans(scene);
  const usable = spans.reduce((s, x) => s + x.usableMm, 0);

  return (
    <section className="gfl-panel" aria-label="Reconstruction gate">
      <header className="gfl-panel__head">
        <h2>Phase 14 · Gate</h2>
        <p>
          {gate.pass ? "Pass" : "Blocked"} · openings {scene.openings.length} · floors{" "}
          {scene.floors.length} · fixtures {scene.fixtures.length} · usable wall{" "}
          {Math.round(usable)} mm
        </p>
      </header>
      <ul className="gfl-score__list">
        {gate.issues.length === 0 ? (
          <li className="is-pass">✓ No structural errors</li>
        ) : (
          gate.issues.map((i) => (
            <li key={i.id} className={i.severity === "error" ? "is-fail" : undefined}>
              {i.severity}: {i.message}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
