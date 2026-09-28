import { describe, expect, it } from "vitest";
import { interiorsWorkflowSteps, workflowStepAccessibleLabel, type WorkflowStepFacts } from "./interiorsWorkflowSteps";

const empty: WorkflowStepFacts = {
  area: "room", wallCount: 0, cabinetCount: 0, materialCount: 0, blockingIssueCount: 0, jobStatus: "draft",
};

describe("interiorsWorkflowSteps", () => {
  it("numbers the five steps in order and marks the current one", () => {
    const steps = interiorsWorkflowSteps({ ...empty, area: "materials" });
    expect(steps.map((step) => `${step.number}.${step.label}`)).toEqual([
      "1.Room", "2.Cabinets", "3.Materials", "4.Review", "5.Present",
    ]);
    expect(steps.filter((step) => step.current).map((step) => step.id)).toEqual(["materials"]);
  });

  it("starts with everything to do", () => {
    expect(interiorsWorkflowSteps(empty).every((step) => step.status === "todo")).toBe(true);
  });

  it("marks steps done as the job progresses", () => {
    const steps = interiorsWorkflowSteps({
      ...empty, wallCount: 4, cabinetCount: 6, materialCount: 3, jobStatus: "quoted",
    });
    expect(steps.map((step) => step.status)).toEqual(["done", "done", "done", "done", "done"]);
  });

  it("blocks Review while blocking issues remain", () => {
    const review = interiorsWorkflowSteps({ ...empty, wallCount: 4, cabinetCount: 2, blockingIssueCount: 1 })
      .find((step) => step.id === "review")!;
    expect(review.status).toBe("blocked");
    expect(workflowStepAccessibleLabel(review)).toBe("Step 4: Review, has blocking issues");
  });
});
