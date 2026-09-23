import { describe, expect, it } from "vitest";
import { engineeringCutlistState } from "./engineeringCutlistState";

describe("engineering cut list state", () => {
  it("distinguishes a blocked export from an empty project", () => {
    expect(engineeringCutlistState({ lineCount: 0, status: "", machineError: null }).kind).toBe("empty");
    const blocked = engineeringCutlistState({
      lineCount: 0,
      status: "Production export blocked by cabinet identity diagnostics.",
      machineError: "Production export blocked: adapter loss",
    });
    expect(blocked.kind).toBe("blocked");
    if (blocked.kind === "blocked") expect(blocked.message).toContain("adapter loss");
    expect(engineeringCutlistState({ lineCount: 4, status: "", machineError: null }).kind).toBe("ready");
  });
});
