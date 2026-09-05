import type { ArchitecturalScene } from "./archSceneTypes";

type Props = {
  scene: ArchitecturalScene | null;
};

export function TopologyPanel({ scene }: Props) {
  if (!scene) {
    return (
      <section className="gfl-panel" aria-label="Wall topology">
        <header className="gfl-panel__head">
          <h2>Phase 7 · Topology</h2>
          <p>Load a proposal to build wall junctions.</p>
        </header>
      </section>
    );
  }

  const corners = scene.wallJunctions.filter((j) => j.kind === "corner").length;
  const tees = scene.wallJunctions.filter((j) => j.kind === "T").length;
  const exteriors = scene.walls.filter((w) => w.type === "exterior").length;

  return (
    <section className="gfl-panel" aria-label="Wall topology">
      <header className="gfl-panel__head">
        <h2>Phase 7 · Topology</h2>
        <p>
          {scene.walls.length} walls · {scene.wallJunctions.length} junctions · {corners} corners ·{" "}
          {tees} T · {exteriors} exterior
        </p>
      </header>
      <ul className="gfl-score__list">
        {scene.wallJunctions.slice(0, 12).map((j) => (
          <li key={j.id}>
            {j.id} · {j.kind} · walls {j.wallIds.join(", ")}
          </li>
        ))}
      </ul>
    </section>
  );
}
