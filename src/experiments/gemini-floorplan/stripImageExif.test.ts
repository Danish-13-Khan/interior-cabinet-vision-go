import { describe, expect, it } from "vitest";
import { prepareVisionImage, stripImageExif, VISION_MAX_EDGE_PX } from "./stripImageExif";

describe("prepareVisionImage", () => {
  it("passes through non-raster files unchanged", async () => {
    const pdf = new File(["%PDF-1.4"], "plan.pdf", { type: "application/pdf" });
    await expect(prepareVisionImage(pdf)).resolves.toBe(pdf);
    await expect(stripImageExif(pdf)).resolves.toBe(pdf);
  });

  it("exports a max-edge constant for Vision payloads", () => {
    expect(VISION_MAX_EDGE_PX).toBe(1600);
  });
});
