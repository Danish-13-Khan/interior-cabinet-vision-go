import type { Phase1ProofPack } from "./proofTypes";

/** Markdown skeleton for PR attachments + scorecard readout. */
export function formatPhase1ProofMarkdown(pack: Phase1ProofPack): string {
  const lines = [
    "# Phase 1 proof pack",
    "",
    `Generated: ${pack.generatedAt}`,
    `Overall: **${pack.overall.toUpperCase()}**`,
    "",
    "## Latency environment",
    pack.latencyEnvironment,
    "",
    ...(pack.latencyEvidence
      ? [
          "## Latency evidence",
          `- Surface: \`${pack.latencyEvidence.appSurface}\``,
          `- Machine: ${pack.latencyEvidence.machine}`,
          ...(pack.latencyEvidence.substituteReason
            ? [`- Substitute reason: ${pack.latencyEvidence.substituteReason}`]
            : []),
          "",
        ]
      : []),
    "",
    "## Frames",
    ...pack.frames.map((frame) => `- \`${frame.frameId}\` · camera \`${frame.cameraId}\``),
    "",
    "## Scorecard",
    "| Check | Status | Detail |",
    "|---|---|---|",
    ...pack.checks.map(
      (check) => `| ${check.id} | ${check.status} | ${check.detail.replace(/\|/g, "/")} |`,
    ),
    "",
    "## Draft vs Client Preview ladder",
    "| Frame | Diff axes | Pass |",
    "|---|---|---|",
    ...pack.frameLadders.map((row) =>
      `| ${row.frameId} | ${row.differences.join(", ") || "—"} | ${row.pass ? "yes" : "no"} |`
    ),
    "",
    "## Latency table (fill `latency-samples.json`)",
    "| Frame | Draft ms | Client Preview ms |",
    "|---|---:|---:|",
    ...pack.latencyTable.map((row) =>
      `| ${row.frameId} | ${row.draftMs ?? ""} | ${row.clientPreviewMs ?? ""} |`
    ),
    "",
    "## Manual PR attachments",
    "- Side-by-side Draft vs Client Preview PNGs under `tmp/phase-1-baselines/`",
    "- Fill `fixtures/phase-1-benchmarks/latency-samples.json` or run `npm run phase1:latency`, then re-run `npm run phase1:proof`",
    "- Machine string and optional substitute reason live in that JSON",
    "",
  ];
  return lines.join("\n");
}
