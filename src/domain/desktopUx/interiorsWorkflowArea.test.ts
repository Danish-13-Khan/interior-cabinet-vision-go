import { describe, expect, it } from "vitest";
import {
  applyInteriorsWorkflowArea,
  interiorsWorkflowAreaFromChrome,
  interiorsWorkflowAreaLabel,
  INTERIORS_WORKFLOW_AREAS,
} from "./interiorsWorkflowArea";

describe("interiorsWorkflowArea", () => {
  it("exposes five unnumbered free areas", () => {
    expect(INTERIORS_WORKFLOW_AREAS.map((area) => area.label)).toEqual([
      "Room",
      "Cabinets",
      "Materials",
      "Review",
      "Present",
    ]);
  });

  it("maps each area onto existing planner/studio chrome without new engines", () => {
    expect(applyInteriorsWorkflowArea("room")).toEqual({
      plannerMode: "build",
      studioPanel: "build",
      chromeTool: "select",
      workspaceView: "plan",
    });
    expect(applyInteriorsWorkflowArea("cabinets").studioPanel).toBe("cabinets");
    expect(applyInteriorsWorkflowArea("materials").studioPanel).toBe("materials");
    expect(applyInteriorsWorkflowArea("review").plannerMode).toBe("design");
    expect(applyInteriorsWorkflowArea("present")).toMatchObject({
      plannerMode: "render",
      workspaceView: "model",
    });
  });

  it("preserves Review while design chrome stays active", () => {
    expect(
      interiorsWorkflowAreaFromChrome({
        plannerMode: "design",
        studioPanel: "cabinets",
        workflowArea: "review",
      }),
    ).toBe("review");
    expect(
      interiorsWorkflowAreaFromChrome({
        plannerMode: "render",
        studioPanel: "cabinets",
        workflowArea: "review",
      }),
    ).toBe("present");
  });

  it("labels areas for chrome without step numbers", () => {
    expect(interiorsWorkflowAreaLabel("room")).toBe("Room");
    expect(interiorsWorkflowAreaLabel("present")).toBe("Present");
  });
});
