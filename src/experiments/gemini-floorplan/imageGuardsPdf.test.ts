import { describe, expect, it } from "vitest";
import { guardFloorplanPdf } from "./imageGuards";

describe("guardFloorplanPdf", () => {
  it("accepts pdf mime or extension", () => {
    const byMime = new File(["x"], "a.pdf", { type: "application/pdf" });
    Object.defineProperty(byMime, "size", { value: 100 });
    expect(guardFloorplanPdf(byMime).ok).toBe(true);

    const byName = new File(["x"], "plan.PDF", { type: "" });
    Object.defineProperty(byName, "size", { value: 100 });
    expect(guardFloorplanPdf(byName).ok).toBe(true);
  });

  it("rejects empty pdf", () => {
    const empty = new File([], "a.pdf", { type: "application/pdf" });
    expect(guardFloorplanPdf(empty).ok).toBe(false);
  });
});
