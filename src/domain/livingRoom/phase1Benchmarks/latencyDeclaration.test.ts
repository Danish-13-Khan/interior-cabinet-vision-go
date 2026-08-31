import { describe, expect, it } from "vitest";
import {
  describeLatencyDeclaration,
  isOfficialDesktopUserLatency,
  latencyDeclarationGaps,
  officialDesktopUserLatencyDisclaimer,
  parseLatencyBuildMode,
} from "./latencyDeclaration";

const tauriRelease = {
  machine: "Apple M3 · macOS · 16 GB · plugged in",
  buildMode: "release" as const,
  appSurface: "tauri-desktop",
};

describe("declared latency benchmark", () => {
  it("names hardware and build mode before a measurement can be official", () => {
    expect(parseLatencyBuildMode("release")).toBe("release");
    expect(parseLatencyBuildMode("")).toBe("unspecified");
    expect(latencyDeclarationGaps({ ...tauriRelease, machine: "", buildMode: "unspecified" }))
      .toEqual(["hardware", "build mode"]);
    expect(isOfficialDesktopUserLatency(tauriRelease)).toBe(true);
    expect(describeLatencyDeclaration(tauriRelease)).toContain("build release");
    expect(officialDesktopUserLatencyDisclaimer(tauriRelease)).toBeUndefined();
  });

  it("does not present CI or browser substitute timing as desktop user latency", () => {
    const ci = {
      machine: "GitHub Actions ubuntu",
      buildMode: "ci-dev" as const,
      appSurface: "browser-dev-substitute",
      substituteReason: "CI preview harness",
    };
    expect(isOfficialDesktopUserLatency(ci)).toBe(false);
    expect(describeLatencyDeclaration(ci)).toContain("Not desktop user latency (REL-009)");
    expect(officialDesktopUserLatencyDisclaimer(ci)).toBe("Not desktop user latency (REL-009).");
  });
});
