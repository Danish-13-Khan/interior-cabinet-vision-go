import { describe, expect, it } from "vitest";
import {
  hasInteriorsInspectorSelection,
  interiorsJobStatusLabel,
  interiorsSaveLabel,
  interiorsSelectionTitle,
  isInteriorsChromeToolReady,
  mapInteriorsChromeTool,
} from "./interiorsChrome";

describe("interiorsChrome", () => {
  it("maps the shared rail onto existing build and studio commands", () => {
    expect(mapInteriorsChromeTool("select")).toEqual({ buildTool: "select" });
    expect(mapInteriorsChromeTool("room")).toEqual({
      plannerMode: "build",
      studioPanel: "build",
      buildTool: "draw-room",
    });
    expect(mapInteriorsChromeTool("cabinet")).toEqual({
      plannerMode: "design",
      studioPanel: "cabinets",
      buildTool: "select",
    });
    expect(mapInteriorsChromeTool("material").studioPanel).toBe("materials");
    expect(mapInteriorsChromeTool("import").buildTool).toBe("upload-underlay");
  });

  it("keeps Run and Open shelf unavailable until Cabinet Run", () => {
    expect(isInteriorsChromeToolReady("run")).toBe(false);
    expect(isInteriorsChromeToolReady("shelf")).toBe(false);
    expect(isInteriorsChromeToolReady("cabinet")).toBe(true);
  });

  it("shows the inspector only for a real selection", () => {
    expect(hasInteriorsInspectorSelection({})).toBe(false);
    expect(hasInteriorsInspectorSelection({ wallSelected: true })).toBe(true);
    expect(hasInteriorsInspectorSelection({ objectSelected: true })).toBe(true);
    expect(hasInteriorsInspectorSelection({ openingSelected: true })).toBe(true);
  });

  it("labels job status from the existing commercial job without new engines", () => {
    expect(interiorsJobStatusLabel("draft", false)).toBe("Room");
    expect(interiorsJobStatusLabel("draft", true)).toBe("Design");
    expect(interiorsJobStatusLabel("quoted", true)).toBe("Quote Frozen");
    expect(interiorsJobStatusLabel("approved", true)).toBe("Approved");
    expect(interiorsJobStatusLabel("production", true)).toBe("Sent");
  });

  it("shows save state and a selection title for the shared inspector", () => {
    expect(interiorsSaveLabel(false, "idle")).toBe("Saved");
    expect(interiorsSaveLabel(true, "idle")).toBe("Unsaved");
    expect(interiorsSaveLabel(true, "saving")).toBe("Saving");
    expect(interiorsSelectionTitle({ selectedCount: 0 })).toBe("Nothing selected");
    expect(interiorsSelectionTitle({ wallLabel: "North wall", selectedCount: 0 })).toBe("North wall");
    expect(interiorsSelectionTitle({ objectName: "Base A", selectedCount: 1 })).toBe("Base A");
  });
});
