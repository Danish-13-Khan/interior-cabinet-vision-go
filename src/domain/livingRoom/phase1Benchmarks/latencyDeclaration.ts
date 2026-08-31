export type LatencyBuildMode = "release" | "ci-dev" | "browser-dev";

export type DeclaredLatencyEvidence = {
  machine: string;
  buildMode: LatencyBuildMode | "unspecified";
  appSurface: string;
  substituteReason?: string;
};

const USER_LATENCY_DISCLAIMER = "Not desktop user latency (REL-009).";

export function parseLatencyBuildMode(value: unknown): LatencyBuildMode | "unspecified" {
  if (value === "release" || value === "ci-dev" || value === "browser-dev") return value;
  return "unspecified";
}

/** Official desktop user latency is a Tauri release build on a named machine. */
export function isOfficialDesktopUserLatency(evidence: DeclaredLatencyEvidence): boolean {
  return evidence.appSurface === "tauri-desktop"
    && evidence.buildMode === "release"
    && Boolean(evidence.machine.trim())
    && evidence.machine !== "unspecified-machine";
}

export function latencyDeclarationGaps(evidence: DeclaredLatencyEvidence): string[] {
  const gaps: string[] = [];
  if (!evidence.machine.trim() || evidence.machine === "unspecified-machine") {
    gaps.push("hardware");
  }
  if (evidence.buildMode === "unspecified") gaps.push("build mode");
  return gaps;
}

export function describeLatencyDeclaration(evidence: DeclaredLatencyEvidence): string {
  const named = [
    `hardware ${evidence.machine}`,
    `build ${evidence.buildMode}`,
    `surface ${evidence.appSurface}`,
  ];
  if (evidence.substituteReason) named.push(`substitute: ${evidence.substituteReason}`);
  if (!isOfficialDesktopUserLatency(evidence)) named.push(USER_LATENCY_DISCLAIMER);
  return named.join(" · ");
}

export function officialDesktopUserLatencyDisclaimer(
  evidence: DeclaredLatencyEvidence,
): string | undefined {
  return isOfficialDesktopUserLatency(evidence) ? undefined : USER_LATENCY_DISCLAIMER;
}
