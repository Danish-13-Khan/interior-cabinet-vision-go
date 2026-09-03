import { interiorsPresentCountLabel, type InteriorsPresentStep } from "../../domain/desktopUx";

export function InteriorsPresentStatus({
  sellTotalLabel,
  revision,
  frozen,
  step,
  blockingCount,
}: {
  sellTotalLabel: string;
  revision: string;
  frozen: boolean;
  step: InteriorsPresentStep;
  blockingCount: number;
}) {
  const next = blockingCount
    ? `${blockingCount} blocking · ${step}`
    : step === "done" ? "Close complete" : `Next: ${step}`;
  return (
    <footer className="lr-plan-status lr-draw-status lr-present-status" data-testid="interiors-present-status">
      <span>{interiorsPresentCountLabel({ sellTotalLabel, revision, frozen })}</span>
      <span className={blockingCount ? "has-warning" : "is-clear"}>{next}</span>
    </footer>
  );
}
