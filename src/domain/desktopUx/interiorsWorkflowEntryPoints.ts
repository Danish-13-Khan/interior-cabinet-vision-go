/** Runtime entry-point signatures for UI redesign Step 8 verification. */

import {
  INTERIORS_WORKFLOW_AREAS,
  type InteriorsWorkflowArea,
} from "./interiorsWorkflowArea";

export type WorkflowEntryPoint = {
  area: InteriorsWorkflowArea;
  areaTestId: string;
  /** One stable control that proves the area panel mounted. */
  signatureTestId: string;
  label: string;
};

export const WORKFLOW_ENTRY_POINTS: readonly WorkflowEntryPoint[] = [
  {
    area: "room",
    areaTestId: "interiors-workflow-area-room",
    signatureTestId: "interiors-tool-select",
    label: "Room tools",
  },
  {
    area: "cabinets",
    areaTestId: "interiors-workflow-area-cabinets",
    signatureTestId: "interiors-cabinet-run-catalog",
    label: "Cabinet families",
  },
  {
    area: "materials",
    areaTestId: "interiors-workflow-area-materials",
    signatureTestId: "paint-apply-summary",
    label: "Material paint summary",
  },
  {
    area: "review",
    areaTestId: "interiors-workflow-area-review",
    signatureTestId: "interiors-review-panel",
    label: "Review panel",
  },
  {
    area: "present",
    areaTestId: "interiors-workflow-area-present",
    signatureTestId: "interiors-present-titlebar",
    label: "Present titlebar",
  },
] as const;

export function workflowEntryPointAreas(): InteriorsWorkflowArea[] {
  return INTERIORS_WORKFLOW_AREAS.map((entry) => entry.id);
}

export function listWorkflowEntryPointTestIds(): string[] {
  return WORKFLOW_ENTRY_POINTS.map((entry) => entry.areaTestId);
}

export function workflowEntryPointForArea(area: InteriorsWorkflowArea): WorkflowEntryPoint {
  const row = WORKFLOW_ENTRY_POINTS.find((entry) => entry.area === area);
  if (!row) throw new Error(`Unknown workflow area: ${area}`);
  return row;
}
