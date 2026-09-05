import { describe, expect, it } from "vitest";
import { collectReferenceDimensions } from "./referenceDimensions";
import { createLivingRoomStarterProject } from "./preset";

describe("referenceDimensions", () => {
  it("returns reference (non-driving) offsets that update with geometry", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-31T00:00:00.000Z" });
    const dims = collectReferenceDimensions(project);
    expect(dims.length).toBeGreaterThan(0);
    expect(dims.every((dim) => dim.role === "reference")).toBe(true);
    expect(dims.some((dim) => dim.kind === "cabinet-to-wall" || dim.kind === "cabinet-to-opening")).toBe(true);
  });
});
