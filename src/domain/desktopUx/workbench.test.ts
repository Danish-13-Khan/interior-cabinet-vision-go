import { describe, expect, it } from "vitest";
import { normalizeWorkbenchMode, workbenchBreadcrumb } from "./workbench";

describe("workbench", () => {
  it("normalizes unknown modes to job", () => {
    expect(normalizeWorkbenchMode("unknown")).toBe("job");
    expect(normalizeWorkbenchMode("production")).toBe("production");
    expect(normalizeWorkbenchMode("interiors")).toBe("interiors");
  });

  it("builds a contextual breadcrumb", () => {
    expect(workbenchBreadcrumb("cabinets", "Kitchen", "Sink Base")).toBe(
      "Job > Kitchen > Sink Base",
    );
    expect(workbenchBreadcrumb("drawings", "Kitchen")).toBe(
      "Job > Kitchen > Drawings",
    );
    expect(workbenchBreadcrumb("interiors", "Living Room")).toBe(
      "Job > Living Room > Interior Plan",
    );
  });
});
