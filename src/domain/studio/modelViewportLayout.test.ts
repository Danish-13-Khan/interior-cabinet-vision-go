import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("studio model viewport layout", () => {
  it("keeps the catalog out of the 3D grid so the canvas can fill the stage", () => {
    const css = readFileSync(new URL("../../styles/studio-model.css", import.meta.url), "utf8");
    expect(css).toContain(".is-model > .lr-catalog");
    expect(css).toMatch(/\.is-model > \.lr-catalog[\s\S]*display:\s*none\s*!important/);
    expect(css).toContain("grid-column: 1");
    expect(css).toContain("minmax(0, 1fr) minmax(280px, 340px)");
  });
});
