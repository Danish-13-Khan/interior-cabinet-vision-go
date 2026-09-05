import { useState } from "react";
import {
  downloadInteriorProjectFile,
  stashAcceptedInteriorProject,
  summarizeAcceptedProject,
  type AcceptSummary,
} from "./acceptBridge";
import { mapProposalToInteriorProject } from "./mapProposalToInteriorProject";
import type { GeminiFloorProposal } from "./proposalTypes";

type Props = {
  proposal: GeminiFloorProposal | null;
};

export function AcceptBridgePanel({ proposal }: Props) {
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [summary, setSummary] = useState<AcceptSummary | null>(null);

  function onAccept() {
    if (!proposal) {
      setError("Load or extract a proposal before accepting.");
      return;
    }
    if (!reviewed) {
      setError("Confirm you reviewed scale and walls before accepting.");
      return;
    }
    const mapped = mapProposalToInteriorProject(proposal, {
      projectName: proposal.rooms[0]?.name
        ? `${proposal.rooms[0].name} (Gemini draft)`
        : "Gemini floor-plan draft",
    });
    if (!mapped.ok) {
      setError(mapped.error);
      setSummary(null);
      return;
    }
    stashAcceptedInteriorProject(mapped.project);
    downloadInteriorProjectFile(mapped.project);
    setWarnings(mapped.warnings);
    setSummary(summarizeAcceptedProject(mapped.project));
    setError(null);
  }

  function onReject() {
    setSummary(null);
    setWarnings([]);
    setError(null);
    setReviewed(false);
  }

  return (
    <section className="gfl-panel gfl-accept" aria-label="Accept into interior project">
      <header className="gfl-panel__head">
        <h2>Accept bridge</h2>
        <p>Phase 4 — explicit accept only. AI is not the source of truth after this.</p>
      </header>
      <div className="gfl-accept__body">
        {!proposal ? (
          <p className="gfl-accept__meta">No proposal yet. Run Vision or load an offline fixture.</p>
        ) : (
          <>
            <label className="gfl-accept__check">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => {
                  setReviewed(e.target.checked);
                  setError(null);
                }}
              />
              <span>I reviewed scale, walls, and confidence</span>
            </label>
            <div className="gfl-accept__actions">
              <button type="button" className="gfl-accept__primary" onClick={onAccept}>
                Accept → interior draft
              </button>
              <button type="button" onClick={onReject}>
                Clear accept state
              </button>
            </div>
          </>
        )}
        {error ? <p className="gfl-accept__error">{error}</p> : null}
        {summary ? (
          <div className="gfl-accept__summary">
            <strong>Accepted draft</strong>
            <p>
              {summary.projectName} · {summary.roomCount} room(s) · {summary.wallCount} wall(s)
            </p>
            <p className="gfl-accept__meta">
              Downloaded JSON + saved to sessionStorage. Open it in the designer via File → Open
              when you are ready — geometry is normal plan data, not an AI model of truth.
            </p>
            <p className="gfl-accept__meta">Rooms: {summary.roomNames.join(", ") || "—"}</p>
          </div>
        ) : null}
        {warnings.length ? (
          <ul className="gfl-accept__warnings">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
