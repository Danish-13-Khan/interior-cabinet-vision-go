import { describe, expect, it } from "vitest";
import {
  listWorkflowEntryPointTestIds,
  workflowEntryPointAreas,
  workflowEntryPointForArea,
  WORKFLOW_ENTRY_POINTS,
} from "./interiorsWorkflowEntryPoints";

describe("interiorsWorkflowEntryPoints", () => {
  it("covers all five free workflow areas once", () => {
    expect(workflowEntryPointAreas()).toEqual([
      "room", "cabinets", "materials", "review", "present",
    ]);
    expect(WORKFLOW_ENTRY_POINTS).toHaveLength(5);
    expect(listWorkflowEntryPointTestIds()).toEqual([
      "interiors-workflow-area-room",
      "interiors-workflow-area-cabinets",
      "interiors-workflow-area-materials",
      "interiors-workflow-area-review",
      "interiors-workflow-area-present",
    ]);
  });

  it("keeps stable panel signatures for runtime smoke", () => {
    expect(workflowEntryPointForArea("cabinets").signatureTestId)
      .toBe("interiors-cabinet-run-catalog");
    expect(workflowEntryPointForArea("materials").signatureTestId)
      .toBe("paint-apply-summary");
    expect(workflowEntryPointForArea("review").signatureTestId)
      .toBe("interiors-review-panel");
    expect(workflowEntryPointForArea("present").signatureTestId)
      .toBe("interiors-present-titlebar");
  });
});
