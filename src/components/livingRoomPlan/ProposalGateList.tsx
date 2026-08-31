import type { ProposalGate } from "../../domain/livingRoom/proposal";

const STATUS_LABEL: Record<"pass" | "fail" | "warn", string> = {
  pass: "Pass",
  fail: "Fail",
  warn: "Review",
};

/** Full proposal pre-export checklist (layout, commercial, views). */
export function ProposalGateList({ gate }: { gate: ProposalGate }) {
  return (
    <ul className="pre-export-checklist" data-testid="proposal-gate">
      {gate.items.map((item) => (
        <li
          key={item.id}
          className={`pre-export-check is-${item.status}`}
          data-check-id={item.id}
          data-check-status={item.status}
        >
          <span>{STATUS_LABEL[item.status]}</span>
          <strong>{item.label}</strong>
          <small>{item.detail}</small>
        </li>
      ))}
    </ul>
  );
}
