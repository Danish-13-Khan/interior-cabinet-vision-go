import type { JobStatus } from "../jobMeta";
import { INTERIORS_WORKFLOW_AREAS, type InteriorsWorkflowArea } from "./interiorsWorkflowArea";

export type WorkflowStepStatus = "done" | "todo" | "blocked";

export type WorkflowStep = {
  id: InteriorsWorkflowArea;
  label: string;
  number: number;
  status: WorkflowStepStatus;
  current: boolean;
};

export type WorkflowStepFacts = {
  area: InteriorsWorkflowArea;
  wallCount: number;
  cabinetCount: number;
  materialCount: number;
  blockingIssueCount: number;
  jobStatus: JobStatus;
};

function stepStatus(id: InteriorsWorkflowArea, facts: WorkflowStepFacts): WorkflowStepStatus {
  const hasCabinets = facts.cabinetCount > 0;
  switch (id) {
    case "room":
      return facts.wallCount >= 3 ? "done" : "todo";
    case "cabinets":
      return hasCabinets ? "done" : "todo";
    case "materials":
      return hasCabinets && facts.materialCount > 0 ? "done" : "todo";
    case "review":
      if (facts.blockingIssueCount > 0) return "blocked";
      return hasCabinets ? "done" : "todo";
    case "present":
      return facts.jobStatus === "draft" ? "todo" : "done";
  }
}

/** Numbered top-bar steps (Room → Present) with done / to-do / blocked state. Navigation stays free. */
export function interiorsWorkflowSteps(facts: WorkflowStepFacts): WorkflowStep[] {
  return INTERIORS_WORKFLOW_AREAS.map((entry, index) => ({
    id: entry.id,
    label: entry.label,
    number: index + 1,
    status: stepStatus(entry.id, facts),
    current: entry.id === facts.area,
  }));
}

export function workflowStepAccessibleLabel(step: WorkflowStep): string {
  const state = step.status === "done" ? "done" : step.status === "blocked" ? "has blocking issues" : "to do";
  return `Step ${step.number}: ${step.label}, ${state}`;
}
