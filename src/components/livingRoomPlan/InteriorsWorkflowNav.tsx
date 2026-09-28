import {
  workflowStepAccessibleLabel,
  type InteriorsWorkflowArea,
  type WorkflowStep,
} from "../../domain/desktopUx";

type InteriorsWorkflowNavProps = {
  steps: WorkflowStep[];
  disabled?: boolean;
  onArea: (area: InteriorsWorkflowArea) => void;
};

/** Numbered workflow steps in the top bar. Navigation stays free; state is shown, not enforced. */
export function InteriorsWorkflowNav({ steps, disabled = false, onArea }: InteriorsWorkflowNavProps) {
  return (
    <nav className="lr-workflow-steps" aria-label="Interiors design areas" data-testid="interiors-workflow-nav">
      {steps.map((step) => (
        <button
          type="button"
          key={step.id}
          className={`lr-workflow-step is-${step.status}${step.current ? " is-active" : ""}`}
          aria-pressed={step.current}
          aria-label={workflowStepAccessibleLabel(step)}
          data-testid={`interiors-workflow-area-${step.id}`}
          data-step-status={step.status}
          disabled={disabled}
          onClick={() => onArea(step.id)}
        >
          <span className="lr-workflow-step-mark" aria-hidden="true">
            {step.status === "done" && !step.current ? "✓" : step.status === "blocked" ? "!" : step.number}
          </span>
          <span className="lr-workflow-step-label">{step.label}</span>
        </button>
      ))}
    </nav>
  );
}
