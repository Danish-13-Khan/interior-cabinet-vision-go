import type { InteriorsRecentProjectCard } from "../../domain/desktopUx";

export type InteriorsRecentRow = InteriorsRecentProjectCard & { thumbnail: string };

export function InteriorsProjectsRecents({
  rows,
  onOpen,
}: {
  rows: InteriorsRecentRow[];
  onOpen: (id: string) => void;
}) {
  return (
    <section className="interiors-projects-recents" aria-label="Recent projects">
      <header className="app-home-section-head">
        <h2>Continue</h2>
        <small>Your recent cabinet jobs</small>
      </header>
      {rows.length ? (
        <div className="interiors-project-list">
          {rows.map((row) => (
            <button
              type="button"
              key={row.id}
              className="interiors-project-row"
              data-testid="open-recent-project"
              onClick={() => onOpen(row.id)}
            >
              <img src={row.thumbnail} alt="" />
              <span className="interiors-project-row-meta">
                <strong>{row.name}</strong>
                <small>{row.kindLabel} · Rev {row.revision} · {row.editedLabel}</small>
              </span>
              <span className={`interiors-project-status is-${row.statusTone}`}>{row.statusLabel}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="app-home-empty">Save a job to keep it here for quick access.</p>
      )}
    </section>
  );
}
