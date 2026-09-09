import { proposalGateJourneyHint } from "../../domain/livingRoom/proposalGateFeedback";

type Props = {
  ready: boolean;
  blockingCount: number;
  frozen: boolean;
  onPresent: () => void;
};

/** Review → Present → engineering journey copy and nav placeholders (Step 7). */
export function InteriorsReviewJourney({ ready, blockingCount, frozen, onPresent }: Props) {
  return (
    <section className="interiors-review-journey" data-testid="interiors-review-journey">
      <p data-testid="interiors-review-journey-hint">
        {proposalGateJourneyHint({ ready, blockingCount, frozen })}
      </p>
      <button type="button" className="is-primary" data-testid="interiors-review-present" onClick={onPresent}>
        Open Present
      </button>
      <p className="interiors-review-journey-note">
        Engineering handoff and production exports stay on Present / the engineering workbench.
        Full quotation, freeze, approval, and export dialog redesigns need a separate design pass.
      </p>
    </section>
  );
}
