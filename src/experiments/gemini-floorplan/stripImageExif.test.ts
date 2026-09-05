import { describe, expect, it } from "vitest";
import { stripImageExif } from "./stripImageExif";

describe("stripImageExif", () => {
  it("passes through non-raster files unchanged", async () => {
    const pdf = new File(["%PDF-1.4"], "plan.pdf", { type: "application/pdf" });
    await expect(stripImageExif(pdf)).resolves.toBe(pdf);
  });
});
