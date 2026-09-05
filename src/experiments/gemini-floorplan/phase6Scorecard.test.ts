import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPhase6ScorecardReport,
  scorecardCompact,
} from "./runPhase6Scorecard";
import { scoreProposal } from "./fixtureScorecard";
import { SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";

const goldenPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../experiments/gemini-floorplan/fixtures/golden/phase6-scorecard.json",
);

describe("Phase 6D fixture scorecard", () => {
  it("scores a clean kitchen as pass", () => {
    const card = scoreProposal(SAMPLE_RECT_KITCHEN_MM, "kitchen", "raw", {
      orthoMin: 0.9,
    });
    expect(card.pass).toBe(true);
    expect(card.wallCount).toBe(4);
  });

  it("golden report: all offline modes pass and match recorded summary", () => {
    const report = buildPhase6ScorecardReport();
    const failures = report.rows.flatMap((row) =>
      [row.raw, row.cleaned, row.model]
        .filter((c): c is NonNullable<typeof c> => Boolean(c) && !c.pass)
        .map((c) => ({
          id: c.fixtureId,
          mode: c.mode,
          failed: c.checks.filter((x) => !x.pass),
        })),
    );
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
    expect(report.summary.readyFor2d52Discussion).toBe(true);

    const compact = {
      version: report.version,
      note: report.note,
      summary: report.summary,
      fixtures: report.rows.map((row) => ({
        id: row.id,
        raw: scorecardCompact(row.raw),
        cleaned: scorecardCompact(row.cleaned),
        model: row.model ? scorecardCompact(row.model) : null,
      })),
    };

    writeFileSync(goldenPath, `${JSON.stringify(compact, null, 2)}\n`);
    const recorded = JSON.parse(readFileSync(goldenPath, "utf8"));
    expect(recorded).toEqual(compact);
  });
});
