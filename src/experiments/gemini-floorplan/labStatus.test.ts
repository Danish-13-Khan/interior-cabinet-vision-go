import { describe, expect, it } from "vitest";
import { buildLabStatus } from "./labStatus";

describe("buildLabStatus", () => {
  it("blocks when API key is missing", () => {
    const s = buildLabStatus({ hasKey: false, fileName: null });
    expect(s.phase).toBe("blocked");
  });

  it("is idle with key and no file", () => {
    const s = buildLabStatus({ hasKey: true, fileName: null });
    expect(s.phase).toBe("idle");
  });

  it("is ready when a file is selected", () => {
    const s = buildLabStatus({ hasKey: true, fileName: "plan.png" });
    expect(s.phase).toBe("ready");
    expect(s.detail).toContain("plan.png");
  });
});
