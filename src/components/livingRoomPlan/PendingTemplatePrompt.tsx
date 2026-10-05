import type { PendingTemplateOffer } from "../../domain/apartmentTemplates/pendingTemplateOffer";

type PendingTemplatePromptProps = {
  offer: PendingTemplateOffer;
  /** A restore-draft is waiting: opening a template must not silently discard it. */
  hasRecovery: boolean;
  onOpen: () => void;
  onDismiss: () => void;
};

/** Register → editor handoff: offer the chosen template; never create a project unasked. */
export function PendingTemplatePrompt({ offer, hasRecovery, onOpen, onDismiss }: PendingTemplatePromptProps) {
  return (
    <section className="planner-v2-recovery" data-testid="interiors-pending-template">
      <div>
        <span>
          {hasRecovery
            ? "Restore or discard your unsaved changes first, then open the template you picked:"
            : "Start from the template you picked when signing up?"}
        </span>
        <strong>{offer.name}</strong>
      </div>
      <button
        type="button"
        className="is-primary"
        data-testid="interiors-pending-template-open"
        disabled={hasRecovery}
        onClick={onOpen}
      >
        Open template
      </button>
      <button type="button" data-testid="interiors-pending-template-dismiss" onClick={onDismiss}>
        Not now
      </button>
    </section>
  );
}
