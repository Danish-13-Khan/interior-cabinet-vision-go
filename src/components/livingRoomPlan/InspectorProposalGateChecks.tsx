import type { ProposalGateItem } from "../../domain/livingRoom/proposal/types";
import {
  proposalGateFeedbackRows,
  proposalGateSeverityClass,
} from "../../domain/livingRoom/proposalGateFeedback";

type Props = {
  items: readonly ProposalGateItem[];
  blockingCount?: number;
  ready?: boolean;
};

/** Existing proposal gate rows — pass/fail/warn with Preview vs Blocks labels. */
export function InspectorProposalGateChecks({ items, blockingCount, ready }: Props) {
  const rows = proposalGateFeedbackRows(items);
  const blocking = blockingCount ?? rows.filter((row) => row.blocking).length;
  return (
    <section className="lr-issues-panel lr-proposal-gate-panel" data-testid="interiors-proposal-gate">
      <h3>
        Proposal readiness <span>{rows.length}</span>
      </h3>
      {ready ? (
        <p className="is-clear" data-testid="interiors-proposal-gate-ready">Ready for Create Proposal</p>
      ) : blocking > 0 ? (
        <p className="lr-model-quality-gate" data-testid="interiors-proposal-gate-blocking">
          {blocking} block{blocking === 1 ? "s" : ""} Create Proposal
        </p>
      ) : null}
      {rows.map((row) => (
        <div
          key={row.id}
          data-proposal-gate={row.id}
          data-gate-status={row.severity}
          className={`lr-proposal-gate-row ${proposalGateSeverityClass(row)}`}
        >
          <b>{row.severity === "error" ? "!" : row.severity === "warning" ? "△" : "✓"}</b>
          <span>
            <strong>{row.label}</strong>
            <small>
              {row.blocking ? "Blocks proposal · " : row.severity === "warning" ? "Advisory · " : "Pass · "}
              {row.detail}
            </small>
          </span>
        </div>
      ))}
    </section>
  );
}
