import { describe, expect, it } from "vitest";
import { parsePerfAllowlist, resolvePerformanceHudAllowed } from "./perfHudGate";

const allow = ["you@studio.test"];

describe("perfHudGate", () => {
  it("parses a comma-separated allowlist", () => {
    expect(parsePerfAllowlist(" A@x.com, b@y.com ,, ")).toEqual(["a@x.com", "b@y.com"]);
    expect(parsePerfAllowlist(null)).toEqual([]);
  });

  it("requires both the flag and an allowlisted email", () => {
    expect(resolvePerformanceHudAllowed({
      search: "?perf=1", email: "you@studio.test", allowlist: allow,
    })).toBe(true);
    expect(resolvePerformanceHudAllowed({
      search: "?perf", email: "you@studio.test", allowlist: allow,
    })).toBe(true);
    expect(resolvePerformanceHudAllowed({
      storageValue: "1", email: "You@Studio.test", allowlist: allow,
    })).toBe(true);
    expect(resolvePerformanceHudAllowed({
      search: "?perf=1", email: "other@studio.test", allowlist: allow,
    })).toBe(false);
    expect(resolvePerformanceHudAllowed({
      search: "?perf=0", storageValue: "1", email: "you@studio.test", allowlist: allow,
    })).toBe(false);
    expect(resolvePerformanceHudAllowed({
      email: "you@studio.test", allowlist: allow,
    })).toBe(false);
  });
});
