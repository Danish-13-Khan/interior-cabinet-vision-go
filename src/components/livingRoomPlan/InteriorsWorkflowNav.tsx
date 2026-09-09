import {
  INTERIORS_WORKFLOW_AREAS,
  type InteriorsWorkflowArea,
} from "../../domain/desktopUx";

type InteriorsWorkflowNavProps = {
  area: InteriorsWorkflowArea;
  disabled?: boolean;
  onArea: (area: InteriorsWorkflowArea) => void;
};

/** Unnumbered free navigation across design areas (Step 3 shared shell). */
export function InteriorsWorkflowNav({ area, disabled = false, onArea }: InteriorsWorkflowNavProps) {
  return (
    <nav className="lr-workflow-nav" aria-label="Design areas" data-testid="interiors-workflow-nav">
      {INTERIORS_WORKFLOW_AREAS.map((entry) => (
        <button
          type="button"
          key={entry.id}
          className={entry.id === area ? "is-active" : ""}
          aria-pressed={entry.id === area}
          data-testid={`interiors-workflow-area-${entry.id}`}
          disabled={disabled}
          onClick={() => onArea(entry.id)}
        >
          {entry.label}
        </button>
      ))}
    </nav>
  );
}
