import { useState } from "react";
import type { InteriorsRecentProjectCard } from "../../domain/desktopUx";

export type InteriorsRecentRow = InteriorsRecentProjectCard & { thumbnail: string };

export function InteriorsProjectsRecents({
  rows,
  onOpen,
  onDelete,
}: {
  rows: InteriorsRecentRow[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const ids = new Set(selected.filter((id) => rows.some((row) => row.id === id)));

  function toggle(id: string) {
    setConfirming(false);
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function removeSelected() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    for (const id of ids) onDelete(id);
    setSelected([]);
    setConfirming(false);
  }

  return (
    <section className="interiors-projects-recents" aria-label="Recent projects">
      <header className="app-home-section-head">
        <h2>Continue</h2>
        <small>Your recent cabinet jobs</small>
        {ids.size ? (
          <button type="button" data-testid="recent-projects-delete" onClick={removeSelected}>
            {confirming ? `Confirm delete (${ids.size})` : `Delete (${ids.size})`}
          </button>
        ) : null}
      </header>
      {rows.length ? (
        <div className="interiors-project-list">
          {rows.map((row) => (
            <div key={row.id} className="interiors-project-row" data-selected={ids.has(row.id) ? "true" : "false"}>
              <label className="interiors-project-select">
                <input
                  type="checkbox"
                  data-testid="recent-project-select"
                  aria-label={`Select ${row.name}`}
                  checked={ids.has(row.id)}
                  onChange={() => toggle(row.id)}
                />
              </label>
              <button type="button" data-testid="open-recent-project" onClick={() => onOpen(row.id)}>
                <img src={row.thumbnail} alt="" />
                <span className="interiors-project-row-meta">
                  <strong>{row.name}</strong>
                  <small>{row.kindLabel} · Rev {row.revision} · {row.editedLabel}</small>
                </span>
              </button>
              <span className={`interiors-project-status is-${row.statusTone}`}>{row.statusLabel}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="app-home-empty">Save a job to keep it here for quick access.</p>
      )}
    </section>
  );
}
