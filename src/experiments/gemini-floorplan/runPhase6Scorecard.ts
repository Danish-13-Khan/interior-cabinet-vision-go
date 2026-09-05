import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { adaptModelOutputToProposal } from "./adaptModelToProposal";
import { cleanProposalGeometry } from "./cleanProposalGeometry";
import { scoreProposal, type ProposalScorecard } from "./fixtureScorecard";
import type { FloorplanModelOutput } from "./floorplanModelTypes";
import { normalizeProposalToMm } from "./normalizeProposal";
import { SAMPLE_L_ROOM_CM, SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";
import type { GeminiFloorProposal } from "./proposalTypes";

export type FixtureScoreRow = {
  id: string;
  raw: ProposalScorecard;
  cleaned: ProposalScorecard;
  model: ProposalScorecard | null;
};

export type Phase6ScorecardReport = {
  version: 1;
  note: string;
  rows: FixtureScoreRow[];
  summary: {
    totalModes: number;
    passed: number;
    failed: number;
    readyFor2d52Discussion: boolean;
  };
};

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readModel(stem: string): FloorplanModelOutput {
  const path = join(
    root,
    "public/experiments/gemini-floorplan/fixtures/cubicasa",
    `${stem}.model.json`,
  );
  return JSON.parse(readFileSync(path, "utf8")) as FloorplanModelOutput;
}

function scoreModes(
  id: string,
  vision: GeminiFloorProposal,
  modelStem: string | null,
): FixtureScoreRow {
  const raw = scoreProposal(vision, id, "raw", {
    orthoMin: 0.5,
    reference: vision,
  });
  const cleaned = scoreProposal(cleanProposalGeometry(vision), id, "cleaned", {
    orthoMin: 0.9,
    reference: vision,
  });
  let model: ProposalScorecard | null = null;
  if (modelStem) {
    const adapted = cleanProposalGeometry(
      adaptModelOutputToProposal(readModel(modelStem), vision),
    );
    model = scoreProposal(adapted, id, "model", {
      orthoMin: 0.85,
      reference: vision,
      wallCountDeltaMax: 6,
      boundsIouMin: 0.65,
    });
  }
  return { id, raw, cleaned, model };
}

/** Deterministic Phase 6D scorecard over offline fixtures. */
export function buildPhase6ScorecardReport(): Phase6ScorecardReport {
  const kitchen = normalizeProposalToMm(SAMPLE_RECT_KITCHEN_MM);
  const living = normalizeProposalToMm(SAMPLE_L_ROOM_CM);
  const rows: FixtureScoreRow[] = [
    scoreModes("rect-kitchen", kitchen, "rect-kitchen"),
    scoreModes("l-living", living, "l-living"),
  ];

  const cards = rows.flatMap((r) => [r.raw, r.cleaned, ...(r.model ? [r.model] : [])]);
  const passed = cards.filter((c) => c.pass).length;
  const failed = cards.length - passed;

  return {
    version: 1,
    note: "Phase 6D golden scorecard — wall count, ortho, bounds IoU, accept/shell gates.",
    rows,
    summary: {
      totalModes: cards.length,
      passed,
      failed,
      readyFor2d52Discussion: failed === 0,
    },
  };
}

export function scorecardCompact(card: ProposalScorecard): {
  pass: boolean;
  wallCount: number;
  orthoRatio: number;
} {
  return {
    pass: card.pass,
    wallCount: card.wallCount,
    orthoRatio: Number(card.orthoRatio.toFixed(3)),
  };
}
