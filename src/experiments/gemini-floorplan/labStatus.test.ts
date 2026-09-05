import { describe, expect, it } from "vitest";
import { buildLabStatus } from "./labStatus";

describe("buildLabStatus", () => {
  it("allows offline work without API key", () => {
    const s = buildLabStatus({ hasKey: false, fileName: null });
    expect(s.phase).toBe("blocked");
    expect(s.detail).toMatch(/offline fixtures/i);
  });

  it("is ready with key and file", () => {
    const s = buildLabStatus({ hasKey: true, fileName: "plan.png" });
    expect(s.phase).toBe("ready");
  });

  it("reports done when proposal exists", () => {
    const s = buildLabStatus({ hasKey: false, fileName: null, hasProposal: true });
    expect(s.phase).toBe("done");
  });

  it("reports busy and error", () => {
    expect(buildLabStatus({ hasKey: true, fileName: "a.png", busy: true }).phase).toBe("busy");
    expect(
      buildLabStatus({ hasKey: true, fileName: "a.png", extractError: "boom" }).phase,
    ).toBe("error");
  });
});
