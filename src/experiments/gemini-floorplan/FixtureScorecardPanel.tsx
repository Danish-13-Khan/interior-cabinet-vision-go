import { scoreProposal } from "./fixtureScorecard";
import type { GeometryViewMode } from "./geometryMode";
import type { GeminiFloorProposal } from "./proposalTypes";

type Props = {
  proposal: GeminiFloorProposal | null;
  mode: GeometryViewMode;
  fixtureHint?: string | null;
};

export function FixtureScorecardPanel({ proposal, mode, fixtureHint }: Props) {
  if (!proposal) {
    return (
      <section className="gfl-panel gfl-score" aria-label="Fixture scorecard">
        <header className="gfl-panel__head">
          <h2>Phase 6D · Scorecard</h2>
          <p>Load a proposal to score wall count, ortho, bounds, accept/shell gates.</p>
        </header>
      </section>
    );
  }

  const card = scoreProposal(proposal, fixtureHint || "live", mode, {
    orthoMin: mode === "raw" ? 0.5 : 0.75,
  });

  return (
    <section className="gfl-panel gfl-score" aria-label="Fixture scorecard">
      <header className="gfl-panel__head">
        <h2>Phase 6D · Scorecard</h2>
        <p>
          {card.pass ? "Pass" : "Fail"} · {card.wallCount} walls · ortho{" "}
          {(card.orthoRatio * 100).toFixed(0)}% · mode {mode}
        </p>
      </header>
      <ul className="gfl-score__list">
        {card.checks.map((c) => (
          <li key={c.id} className={c.pass ? "is-pass" : "is-fail"}>
            <span>{c.pass ? "✓" : "✗"}</span> {c.label}: {String(c.value)}
            {c.detail ? ` (${c.detail})` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
