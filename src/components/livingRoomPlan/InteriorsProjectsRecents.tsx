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
      <header>
        <span>Recent work</span>
        <h2>Continue a project</h2>
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
              <span>
                <strong>{row.name}</strong>
                <small>{row.kindLabel} · Rev {row.revision}</small>
              </span>
              <span className={`interiors-project-status is-${row.statusTone}`}>{row.statusLabel}</span>
              <small>{row.editedLabel}</small>
            </button>
          ))}
        </div>
      ) : (
        <p>Save a job to keep it here for quick access.</p>
      )}
    </section>
  );
}
