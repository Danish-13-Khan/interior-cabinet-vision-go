import { describe, expect, it } from "vitest";
import {
  isUnderlayImageFile,
  planUnderlayFileKind,
} from "./planUnderlayImport";

describe("planUnderlayFileKind", () => {
  it("accepts raster images and PDF for tracing", () => {
    expect(planUnderlayFileKind(new File([], "plan.png", { type: "image/png" }))).toBe("image");
    expect(planUnderlayFileKind(new File([], "plan.jpg", { type: "image/jpeg" }))).toBe("image");
    expect(planUnderlayFileKind(new File([], "scan.WEBP", { type: "" }))).toBe("image");
    expect(planUnderlayFileKind(new File([], "plan.pdf", { type: "application/pdf" }))).toBe("pdf");
  });

  it("routes DWG and DXF to the CAD importer, not extract", () => {
    expect(planUnderlayFileKind(new File([], "kitchen.dxf", { type: "" }))).toBe("cad");
    expect(planUnderlayFileKind(new File([], "house.dwg", { type: "" }))).toBe("cad");
    expect(planUnderlayFileKind(new File([], "ROOM.DWG", { type: "" }))).toBe("cad");
  });

  it("rejects SVG so import never needs an extract API", () => {
    expect(isUnderlayImageFile(new File([], "room.svg", { type: "image/svg+xml" }))).toBe(false);
    expect(planUnderlayFileKind(new File([], "room.svg", { type: "image/svg+xml" }))).toBe("unsupported");
  });
});
