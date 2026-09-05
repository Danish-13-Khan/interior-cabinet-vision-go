import type { ArchitecturalScene } from "./archSceneTypes";

type Props = {
  scene: ArchitecturalScene | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onJoin: (a: string, b: string) => void;
  onSplit: () => void;
};

/** G-7.6 topology repair UI. */
export function TopologyRepairPanel({
  scene,
  selectedId,
  onSelect,
  onJoin,
  onSplit,
}: Props) {
  if (!scene) {
    return (
      <section className="gfl-panel">
        <header className="gfl-panel__head">
          <h2>Topology repair</h2>
          <p>Load a proposal to join/split walls.</p>
        </header>
      </section>
    );
  }
  const wallIds = scene.walls.map((w) => w.id);
  const a = selectedId && wallIds.includes(selectedId) ? selectedId : wallIds[0];
  const b = wallIds.find((id) => id !== a) ?? a;

  return (
    <section className="gfl-panel" aria-label="Topology repair">
      <header className="gfl-panel__head">
        <h2>Topology repair</h2>
        <p>Join dangling ends or split the selected wall at midpoint.</p>
      </header>
      <div className="gfl-geom__toggle">
        <select
          value={a ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          aria-label="Wall A"
        >
          {wallIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => a && b && onJoin(a, b)} disabled={!a || !b}>
          Join A→B
        </button>
        <button type="button" onClick={onSplit} disabled={!selectedId}>
          Split selected
        </button>
      </div>
      <ul className="gfl-score__list">
        {scene.wallJunctions.filter((j) => j.kind === "end").slice(0, 8).map((j) => (
          <li key={j.id}>
            dangling {j.id} · {j.wallIds.join(", ")}
          </li>
        ))}
      </ul>
    </section>
  );
}
