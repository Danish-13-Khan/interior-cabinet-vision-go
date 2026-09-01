import { describe, expect, it } from "vitest";
import { svgToPngDataUrl } from "./pngExport";

describe("technical view PNG export", () => {
  it("throws instead of substituting a placeholder when Node rendering fails", async () => {
    await expect(
      svgToPngDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>'),
    ).rejects.toThrow(/placeholder image/i);
  });

  it("renders a sized SVG in Node", async () => {
    const png = await svgToPngDataUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="#111"/></svg>',
    );
    expect(png.startsWith("data:image/png")).toBe(true);
    expect(png.length).toBeGreaterThan(80);
  });
});
