import { describe, expect, it } from "vitest";
import { classifyPlanUpload, planImportMismatchMessage } from "./planImportKind";

describe("classifyPlanUpload", () => {
  it("sends images and PDF to underlay, DXF/SVG to import walls", () => {
    expect(classifyPlanUpload({ name: "site.png", type: "image/png" })).toBe("underlay-image");
    expect(classifyPlanUpload({ name: "scan.PDF", type: "application/pdf" })).toBe("underlay-pdf");
    expect(classifyPlanUpload({ name: "kitchen.dxf", type: "" })).toBe("import-walls");
    expect(classifyPlanUpload({ name: "room.svg", type: "image/svg+xml" })).toBe("import-walls");
  });

  it("explains picker mismatches", () => {
    expect(planImportMismatchMessage("import-walls", "underlay")).toMatch(/Import walls/);
    expect(planImportMismatchMessage("underlay-image", "import-walls")).toMatch(/tracing underlay/);
    expect(planImportMismatchMessage("underlay-image", "underlay")).toBeNull();
  });
});
