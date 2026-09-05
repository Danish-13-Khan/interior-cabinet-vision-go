import type { ArchitecturalScene } from "./archSceneTypes";
import { DEFAULT_FIXTURE_CATALOG } from "./cabinetMapping";

type Props = {
  scene: ArchitecturalScene | null;
  onReview: (id: string, review: "accepted" | "rejected" | "pending") => void;
  onCatalog: (id: string, catalogId: string) => void;
};

/** G-10.4 fixture accept/reject + G-12 catalog replace. */
export function FixtureReviewPanel({ scene, onReview, onCatalog }: Props) {
  if (!scene) {
    return (
      <section className="gfl-panel">
        <header className="gfl-panel__head">
          <h2>Fixtures</h2>
          <p>Load a proposal to review semantic objects.</p>
        </header>
      </section>
    );
  }
  const catalogOptions = Object.values(DEFAULT_FIXTURE_CATALOG);

  return (
    <section className="gfl-panel" aria-label="Fixture review">
      <header className="gfl-panel__head">
        <h2>Fixture review</h2>
        <p>{scene.fixtures.length} objects · accept / reject / catalog</p>
      </header>
      <ul className="gfl-score__list">
        {scene.fixtures.length === 0 ? (
          <li>No fixtures inferred</li>
        ) : (
          scene.fixtures.map((f) => (
            <li key={f.id}>
              <div>
                {f.id} · {f.type} · {f.confidence} · {f.review}
                {f.annotation ? ` · ${f.annotation}` : ""}
              </div>
              <div className="gfl-geom__toggle">
                <button type="button" onClick={() => onReview(f.id, "accepted")}>
                  Accept
                </button>
                <button type="button" onClick={() => onReview(f.id, "rejected")}>
                  Reject
                </button>
                <select
                  value={f.catalogId ?? ""}
                  onChange={(e) => onCatalog(f.id, e.target.value)}
                  aria-label={`Catalog for ${f.id}`}
                >
                  <option value="">catalog…</option>
                  {catalogOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
