import { describe, expect, it } from "vitest";
import { canExtractFromUnderlay, underlayUploadName } from "./underlayFile";

describe("canExtractFromUnderlay", () => {
  it("accepts raster image underlays", () => {
    expect(canExtractFromUnderlay({ fileName: "plan.png", dataUrl: "data:image/png;base64,AA" })).toBe(true);
    expect(canExtractFromUnderlay({ fileName: "plan.jpg", dataUrl: "data:image/jpeg;base64,AA" })).toBe(true);
  });

  it("rejects missing, DWG and vector underlays", () => {
    expect(canExtractFromUnderlay(null)).toBe(false);
    expect(canExtractFromUnderlay({ sourceType: "dwg", fileName: "a.dwg", dataUrl: "data:image/png;base64,AA" })).toBe(false);
    expect(canExtractFromUnderlay({ fileName: "a.svg", dataUrl: "data:image/svg+xml;base64,AA" })).toBe(false);
  });
});

describe("underlayUploadName", () => {
  it("uses the data URL type for the extension", () => {
    expect(underlayUploadName({ fileName: "Level 1.pdf", dataUrl: "data:image/png;base64,AA" })).toBe("Level 1.png");
    expect(underlayUploadName({ fileName: "scan.png", dataUrl: "data:image/jpeg;base64,AA" })).toBe("scan.jpg");
    expect(underlayUploadName({ fileName: "", dataUrl: "data:image/webp;base64,AA" })).toBe("floorplan.webp");
  });
});
