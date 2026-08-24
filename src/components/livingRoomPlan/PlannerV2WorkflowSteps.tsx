import type { PlannerMode } from "./workspaceProps";

const steps: Array<{ mode: PlannerMode; label: string }> = [
  { mode: "project", label: "1 · Start a project" },
  { mode: "build", label: "2 · Build in 2D" },
  { mode: "design", label: "3 · Design + dimensions" },
  { mode: "render", label: "4 · Review + export" },
];

export function PlannerV2WorkflowSteps({ mode, onChange }: { mode: PlannerMode; onChange: (mode: PlannerMode) => void }) {
  return <nav className="planner-v2-steps" aria-label="Planner steps">{steps.map((step) => (
    <button key={step.mode} type="button" className={step.mode === mode ? "is-active" : ""} onClick={() => onChange(step.mode)}>{step.label}</button>
  ))}</nav>;
}
