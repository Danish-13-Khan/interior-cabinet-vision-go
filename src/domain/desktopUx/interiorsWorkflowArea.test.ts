import { describe, expect, it } from "vitest";
import {
  applyInteriorsWorkflowArea,
  interiorsWorkflowAreaForChromeTool,
  interiorsWorkflowAreaFromChrome,
  interiorsWorkflowAreaLabel,
  interiorsWorkflowCatalogView,
  interiorsWorkflowToolsForArea,
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

  it("lists area-specific tool rail entries for step 4 relocation", () => {
    expect(interiorsWorkflowToolsForArea("room")).toEqual([
      "select", "room", "wall", "door", "window", "import",
    ]);
    expect(interiorsWorkflowToolsForArea("cabinets")).toContain("objects");
    expect(interiorsWorkflowToolsForArea("materials")).toEqual(["select", "material"]);
    expect(interiorsWorkflowToolsForArea("review")).toEqual(["select"]);
  });

  it("maps chrome tools back to workflow areas", () => {
    expect(interiorsWorkflowAreaForChromeTool("wall")).toBe("room");
    expect(interiorsWorkflowAreaForChromeTool("cabinet")).toBe("cabinets");
    expect(interiorsWorkflowAreaForChromeTool("material")).toBe("materials");
  });

  it("routes catalog panels by workflow area and tool", () => {
    expect(interiorsWorkflowCatalogView({ area: "room", chromeTool: "select" })).toBe("room-build");
    expect(interiorsWorkflowCatalogView({ area: "cabinets", chromeTool: "objects" })).toBe("object-browser");
    expect(interiorsWorkflowCatalogView({ area: "materials", chromeTool: "material" })).toBe("materials");
    expect(interiorsWorkflowCatalogView({ area: "review", chromeTool: "select" })).toBe("review");
    expect(interiorsWorkflowCatalogView({ area: "present", chromeTool: "select" })).toBeNull();
  });
});
