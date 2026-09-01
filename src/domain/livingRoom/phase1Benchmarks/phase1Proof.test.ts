import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { serializeInteriorProjectFile } from "../../interiorProject";
import {
  createPhase1BenchmarkProject,
  PHASE1_BENCHMARK_IDS,
  PHASE1_BENCHMARK_NOW,
} from "./index";
import { evaluatePhase1Scorecard } from "./evaluateScorecard";
import { formatPhase1ProofMarkdown } from "./formatProofMarkdown";
import { evaluateAutomation, PHASE1_AUTOMATION_GATE_IDS } from "./evaluateAutomation";
import { evaluateHonesty, lineAffirmsForbiddenClaim } from "./evaluateHonesty";
import {
  buildLatencySamplesTemplate,
  expectedPhase1LatencySlots,
} from "./latencySlots";
import {
  loadPhase1AutomationReport,
  loadPhase1HonestyCorpus,
  loadPhase1LatencySamples,
  phase1FixturesDir,
} from "./proofIo";


function allGatesPassReport() {
  return {
    generatedAt: PHASE1_BENCHMARK_NOW,
    gates: PHASE1_AUTOMATION_GATE_IDS.map((id) => ({ id, pass: true })),
  };
}

describe("phase1 proof pack", () => {
  it("passes unit scorecard gates; latency/automation pending without evidence", () => {
    const pack = evaluatePhase1Scorecard({
      generatedAt: PHASE1_BENCHMARK_NOW,
      honestyCorpus: loadPhase1HonestyCorpus(),
    });
    expect(pack.frameCount).toBe(6);
    expect(pack.frameLadders.every((row) => row.pass)).toBe(true);
    const byId = Object.fromEntries(pack.checks.map((check) => [check.id, check]));
    expect(byId.ladder?.status).toBe("pass");
    expect(byId.grounding?.status).toBe("pass");
    expect(byId["window-key"]?.status).toBe("pass");
    expect(byId.framing?.status).toBe("pass");
    expect(byId.honesty?.status).toBe("pass");
    expect(byId["data-safety"]?.status).toBe("pass");
    expect(byId.latency?.status).toBe("pending");
    expect(byId.automation?.status).toBe("pending");
    expect(pack.overall).toBe("pending");
  });

  it("marks latency + automation pass when evidence is complete", () => {
    const samples = expectedPhase1LatencySlots().map((slot) => ({
      ...slot,
      elapsedMs: slot.quality === "draft" ? 1800 : 5200,
      machine: "test-m-series",
      buildMode: "release" as const,
      appSurface: "tauri-desktop" as const,
    }));
    const pack = evaluatePhase1Scorecard({
      latencySamples: samples,
      automationReport: allGatesPassReport(),
      honestyCorpus: loadPhase1HonestyCorpus(),
      generatedAt: PHASE1_BENCHMARK_NOW,
    });
    expect(pack.checks.find((check) => check.id === "latency")?.status).toBe("pass");
    expect(pack.checks.find((check) => check.id === "automation")?.status).toBe("pass");
    expect(pack.overall).toBe("pass");
  });

  it("keeps CI timings pending and unnamed measurements failing REL-008", () => {
    const ciSamples = expectedPhase1LatencySlots().map((slot) => ({
      ...slot,
      elapsedMs: slot.quality === "draft" ? 1800 : 5200,
      machine: "GitHub Actions",
      buildMode: "ci-dev" as const,
      appSurface: "browser-dev-substitute" as const,
      substituteReason: "CI preview harness",
    }));
    const ciPack = evaluatePhase1Scorecard({
      latencySamples: ciSamples,
      honestyCorpus: loadPhase1HonestyCorpus(),
      generatedAt: PHASE1_BENCHMARK_NOW,
    });
    expect(ciPack.checks.find((check) => check.id === "latency")?.status).toBe("pending");
    expect(ciPack.checks.find((check) => check.id === "latency")?.detail).toContain("REL-009");
    expect(formatPhase1ProofMarkdown(ciPack)).toContain("Not desktop user latency");

    const unnamed = expectedPhase1LatencySlots().map((slot) => ({
      ...slot,
      elapsedMs: 1200,
      machine: "unspecified-machine",
      appSurface: "tauri-desktop" as const,
    }));
    expect(evaluatePhase1Scorecard({
      latencySamples: unnamed,
      honestyCorpus: loadPhase1HonestyCorpus(),
    }).checks.find((check) => check.id === "latency")?.status).toBe("fail");
  });

  it("fails automation when a required gate is missing or red", () => {
    expect(evaluateAutomation(undefined).status).toBe("pending");
    expect(
      evaluateAutomation({
        generatedAt: PHASE1_BENCHMARK_NOW,
        gates: PHASE1_AUTOMATION_GATE_IDS.slice(0, 3).map((id) => ({ id, pass: true })),
      }).status,
    ).toBe("fail");
    expect(
      evaluateAutomation({
        generatedAt: PHASE1_BENCHMARK_NOW,
        gates: PHASE1_AUTOMATION_GATE_IDS.map((id) => ({
          id,
          pass: id !== "qa:smoke",
        })),
      }).status,
    ).toBe("fail");
  });

  it("honesty allows negated Synaps/photoreal mentions but rejects claims", () => {
    expect(lineAffirmsForbiddenClaim("Do not chase Synaps quality.")).toBe(false);
    expect(lineAffirmsForbiddenClaim("Claims of path-traced photorealism.")).toBe(false);
    expect(lineAffirmsForbiddenClaim("| Photorealistic libraries | Add a pipeline |")).toBe(false);
    expect(lineAffirmsForbiddenClaim("Synaps-class photoreal client stills.")).toBe(true);
    expect(evaluateHonesty(["Our app is photoreal and Synaps-grade."]).status).toBe("fail");
    expect(evaluateHonesty(loadPhase1HonestyCorpus()).status).toBe("pass");
  });

  it("exports committed fixtures + proof from disk evidence", () => {
    const fixturesDir = phase1FixturesDir();
    mkdirSync(fixturesDir, { recursive: true });
    const templatePath = join(fixturesDir, "latency-samples.json");
    if (!existsSync(templatePath)) {
      writeFileSync(
        templatePath,
        `${JSON.stringify(buildLatencySamplesTemplate(), null, 2)}\n`,
      );
    }
    for (const id of PHASE1_BENCHMARK_IDS) {
      const project = createPhase1BenchmarkProject(id);
      writeFileSync(
        join(fixturesDir, `${id}.interior.json`),
        serializeInteriorProjectFile(project, PHASE1_BENCHMARK_NOW),
      );
    }
    const pack = evaluatePhase1Scorecard({
      generatedAt: new Date().toISOString(),
      latencySamples: loadPhase1LatencySamples(),
      automationReport: loadPhase1AutomationReport(),
      honestyCorpus: loadPhase1HonestyCorpus(),
    });
    writeFileSync(join(fixturesDir, "proof-pack.json"), `${JSON.stringify(pack, null, 2)}\n`);
    writeFileSync(join(fixturesDir, "PROOF.md"), formatPhase1ProofMarkdown(pack));
    expect(pack.checks).toHaveLength(8);
    expect(pack.checks.some((check) => check.status === "fail")).toBe(false);
  });
});
