import { describe, expect, it } from "vitest";
import { normalizeWorkbenchMode, workbenchBreadcrumb } from "./workbench";

describe("workbench", () => {
  it("normalizes unknown modes to cabinets", () => {
    expect(normalizeWorkbenchMode("unknown")).toBe("cabinets");
    expect(normalizeWorkbenchMode("production")).toBe("production");
  });

  it("builds a contextual breadcrumb", () => {
    expect(workbenchBreadcrumb("cabinets", "Kitchen", "Sink Base")).toBe(
      "Job > Kitchen > Sink Base",
    );
    expect(workbenchBreadcrumb("drawings", "Kitchen")).toBe(
      "Job > Kitchen > Drawings",
    );
  });
});
