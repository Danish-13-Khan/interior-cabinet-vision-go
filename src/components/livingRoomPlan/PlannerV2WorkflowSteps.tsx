import type { PlannerMode } from "./workspaceProps";

const steps: Array<{ mode: PlannerMode; label: string }> = [
  { mode: "project", label: "1 · Start a project" },
  { mode: "build", label: "2 · Build in 2D" },
  { mode: "design", label: "3 · Design + dimensions" },
  { mode: "render", label: "4 · Review + export" },
];

export function PlannerV2WorkflowSteps({ mode, onChange, hasProject }: { mode: PlannerMode; onChange: (mode: PlannerMode) => void; hasProject: boolean }) {
  return <nav className="planner-v2-steps" aria-label="Planner steps">{steps.map((step) => (
    <button
      key={step.mode}
      type="button"
      className={step.mode === mode ? "is-active" : ""}
      disabled={!hasProject && step.mode !== "project"}
      title={!hasProject && step.mode !== "project" ? "Create or open a project first" : undefined}
      onClick={() => onChange(step.mode)}
    >{step.label}</button>
  ))}
    {!hasProject ? <small className="planner-v2-steps-hint">Create or open a project to unlock steps 2–4.</small> : null}
  </nav>;
}
