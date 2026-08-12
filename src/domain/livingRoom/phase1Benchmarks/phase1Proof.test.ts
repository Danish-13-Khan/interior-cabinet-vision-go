import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { serializeInteriorProjectFile } from "../../interiorProject";
import {
  createPhase1BenchmarkProject,
  PHASE1_BENCHMARK_IDS,
  PHASE1_BENCHMARK_NOW,
} from "./index";
import {
  evaluatePhase1Scorecard,
} from "./evaluateScorecard";
import { formatPhase1ProofMarkdown } from "./formatProofMarkdown";

describe("phase1 proof pack", () => {
  it("passes automated scorecard gates for all six frames", () => {
    const pack = evaluatePhase1Scorecard({ generatedAt: PHASE1_BENCHMARK_NOW });
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

  it("marks latency pass when samples are within budget", () => {
    const frames = evaluatePhase1Scorecard().frames;
    const samples = frames.flatMap((frame) => [
      {
        frameId: frame.frameId,
        quality: "draft" as const,
        elapsedMs: 1800,
        machine: "test-m-series",
      },
      {
        frameId: frame.frameId,
        quality: "client-preview" as const,
        elapsedMs: 5200,
        machine: "test-m-series",
      },
    ]);
    const pack = evaluatePhase1Scorecard({ latencySamples: samples });
    expect(pack.checks.find((check) => check.id === "latency")?.status).toBe("pass");
  });

  it("exports committed fixtures + proof markdown skeleton", () => {
    const fixturesDir = join(process.cwd(), "fixtures/phase-1-benchmarks");
    mkdirSync(fixturesDir, { recursive: true });
    for (const id of PHASE1_BENCHMARK_IDS) {
      const project = createPhase1BenchmarkProject(id);
      writeFileSync(
        join(fixturesDir, `${id}.interior.json`),
        serializeInteriorProjectFile(project, PHASE1_BENCHMARK_NOW),
      );
    }
    const pack = evaluatePhase1Scorecard({ generatedAt: PHASE1_BENCHMARK_NOW });
    writeFileSync(join(fixturesDir, "proof-pack.json"), `${JSON.stringify(pack, null, 2)}\n`);
    writeFileSync(join(fixturesDir, "PROOF.md"), formatPhase1ProofMarkdown(pack));
    expect(pack.checks).toHaveLength(8);
  });
});
