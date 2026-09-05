import type { GeminiFloorProposal, ScaleConfidence } from "./proposalTypes";

type Props = { proposal: GeminiFloorProposal | null };

const LABELS: Record<ScaleConfidence, string> = {
  low: "Low — calibrate before trusting sizes",
  medium: "Medium — spot-check a known wall",
  high: "High — scale looks usable",
};

export function ConfidenceNotesPanel({ proposal }: Props) {
  if (!proposal) {
    return (
      <section className="gfl-panel gfl-confidence" aria-label="Confidence and notes">
        <header className="gfl-panel__head">
          <h2>Confidence</h2>
          <p>Vision caveats appear here after extract or fixture load.</p>
        </header>
        <p className="gfl-confidence__empty">No proposal yet.</p>
      </section>
    );
  }

  const conf = proposal.scaleConfidence;
  const notes = proposal.notes?.length ? proposal.notes : ["No Vision notes."];

  return (
    <section className="gfl-panel gfl-confidence" aria-label="Confidence and notes">
      <header className="gfl-panel__head">
        <h2>Confidence</h2>
        <p>Scale confidence and model notes for review.</p>
      </header>
      <div className="gfl-confidence__body">
        <p className={`gfl-confidence__badge gfl-confidence__badge--${conf}`}>
          Scale: {conf} — {LABELS[conf]}
        </p>
        <ul className="gfl-confidence__notes">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        {conf === "low" ? (
          <p className="gfl-confidence__warn">
            Low confidence highlighted on the overlay. Use scale calibration on a known wall.
          </p>
        ) : null}
      </div>
    </section>
  );
}
