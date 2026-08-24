import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  Phase1LatencyAppSurface,
  Phase1LatencySample,
} from "./scorecard";
import type { Phase1AutomationReport } from "./evaluateAutomation";

export type Phase1LatencySamplesFile = {
  machine: string;
  appSurface?: Phase1LatencyAppSurface;
  substituteReason?: string;
  samples: Array<{
    frameId: string;
    quality: "draft" | "client-preview";
    /** null / omitted = not measured yet */
    elapsedMs: number | null;
  }>;
};

const FIXTURES = "fixtures/phase-1-benchmarks";

export function phase1FixturesDir(cwd = process.cwd()) {
  return join(cwd, FIXTURES);
}

/** Load filled latency samples; skips null elapsedMs. Node-only. */
export function loadPhase1LatencySamples(cwd = process.cwd()): Phase1LatencySample[] {
  const path = join(phase1FixturesDir(cwd), "latency-samples.json");
  if (!existsSync(path)) return [];
  const raw = JSON.parse(readFileSync(path, "utf8")) as Phase1LatencySamplesFile;
  const machine = raw.machine?.trim() || "unspecified-machine";
  const appSurface = raw.appSurface ?? "tauri-desktop";
  const substituteReason = raw.substituteReason?.trim() || undefined;
  return (raw.samples ?? [])
    .filter((sample) => typeof sample.elapsedMs === "number" && Number.isFinite(sample.elapsedMs))
    .map((sample) => ({
      frameId: sample.frameId,
      quality: sample.quality,
      elapsedMs: sample.elapsedMs as number,
      machine,
      appSurface,
      substituteReason,
    }));
}

export function loadPhase1AutomationReport(
  cwd = process.cwd(),
): Phase1AutomationReport | undefined {
  const path = join(phase1FixturesDir(cwd), "automation-report.json");
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as Phase1AutomationReport;
}

/** README + key UI sources for the honesty corpus. Node-only. */
export function loadPhase1HonestyCorpus(cwd = process.cwd()): string[] {
  const paths = [
    "README.md",
    "docs/PRODUCT_DECISIONS.md",
    "src/domain/livingRoom/presetHonesty.ts",
    "src/components/livingRoomScene/RenderPresetHonestyBadge.tsx",
    "src/components/LivingRoomRenderStudio.tsx",
    "src/components/livingRoomPlan/PlannerV2ProjectHome.tsx",
  ];
  const texts: string[] = [];
  for (const relative of paths) {
    const absolute = join(cwd, relative);
    if (existsSync(absolute)) texts.push(readFileSync(absolute, "utf8"));
  }
  return texts;
}

export { buildLatencySamplesTemplate, expectedPhase1LatencySlots } from "./latencySlots";
