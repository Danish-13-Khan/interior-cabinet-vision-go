import { buildRoomShell } from "./buildRoomShell";
import { angleDeltaDeg, distMm, nearestOrthoDeg, wallAngleDeg } from "./proposalGeom";
import { proposalBounds } from "./proposalBounds";
import { mapProposalToInteriorProject } from "./mapProposalToInteriorProject";
import type { GeminiFloorProposal } from "./proposalTypes";

export type ScorecardCheck = {
  id: string;
  label: string;
  pass: boolean;
  value: number | string;
  detail?: string;
};

export type ProposalScorecard = {
  fixtureId: string;
  mode: string;
  pass: boolean;
  wallCount: number;
  orthoRatio: number;
  checks: ScorecardCheck[];
};

export type ScoreOptions = {
  wallsMin?: number;
  wallsMax?: number;
  orthoMin?: number;
  /** Optional reference for alignment / wall-count delta. */
  reference?: GeminiFloorProposal;
  boundsIouMin?: number;
  wallCountDeltaMax?: number;
};

function orthoRatio(proposal: GeminiFloorProposal, tolDeg = 8): number {
  if (!proposal.walls.length) return 0;
  let ok = 0;
  for (const w of proposal.walls) {
    const ang = wallAngleDeg(w.a, w.b);
    if (angleDeltaDeg(ang, nearestOrthoDeg(ang)) <= tolDeg) ok += 1;
  }
  return ok / proposal.walls.length;
}

function aabbIou(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
): number {
  const ix0 = Math.max(a.minX, b.minX);
  const iy0 = Math.max(a.minY, b.minY);
  const ix1 = Math.min(a.maxX, b.maxX);
  const iy1 = Math.min(a.maxY, b.maxY);
  const iw = Math.max(0, ix1 - ix0);
  const ih = Math.max(0, iy1 - iy0);
  const inter = iw * ih;
  const areaA = Math.max(a.maxX - a.minX, 0) * Math.max(a.maxY - a.minY, 0);
  const areaB = Math.max(b.maxX - b.minX, 0) * Math.max(b.maxY - b.minY, 0);
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

function check(
  id: string,
  label: string,
  pass: boolean,
  value: number | string,
  detail?: string,
): ScorecardCheck {
  return { id, label, pass, value, detail };
}

/** Phase 6D: wall-count + ortho + bounds + accept/shell sanity (+ optional vs reference). */
export function scoreProposal(
  proposal: GeminiFloorProposal,
  fixtureId: string,
  mode: string,
  options: ScoreOptions = {},
): ProposalScorecard {
  const wallsMin = options.wallsMin ?? 3;
  const wallsMax = options.wallsMax ?? 40;
  const orthoMin = options.orthoMin ?? 0.75;
  const wallCount = proposal.walls.length;
  const ortho = orthoRatio(proposal);
  const bounds = proposalBounds(proposal);
  const checks: ScorecardCheck[] = [];

  checks.push(
    check(
      "wall_count",
      "Wall count sane",
      wallCount >= wallsMin && wallCount <= wallsMax,
      wallCount,
      `${wallsMin}–${wallsMax}`,
    ),
  );
  checks.push(
    check("ortho_ratio", "Near-ortho walls", ortho >= orthoMin, Number(ortho.toFixed(3)), `≥ ${orthoMin}`),
  );
  checks.push(
    check(
      "bounds",
      "Bounds area",
      Boolean(bounds && bounds.width >= 500 && bounds.height >= 500),
      bounds ? `${Math.round(bounds.width)}×${Math.round(bounds.height)}` : "none",
    ),
  );
  checks.push(
    check("rooms", "Has rooms", proposal.rooms.length >= 1, proposal.rooms.length),
  );

  const mapped = mapProposalToInteriorProject(proposal, {
    projectId: `score-${fixtureId}`,
    now: "2026-09-05T00:00:00.000Z",
  });
  checks.push(
    check("accept_map", "Accept mapper OK", mapped.ok, mapped.ok ? "ok" : "fail", mapped.ok ? undefined : mapped.error),
  );

  const shell = buildRoomShell(proposal);
  checks.push(check("shell", "3D shell builds", Boolean(shell), shell ? shell.boxes.length : 0));

  if (options.reference) {
    const refBounds = proposalBounds(options.reference);
    const deltaMax = options.wallCountDeltaMax ?? 4;
    const iouMin = options.boundsIouMin ?? 0.7;
    const delta = Math.abs(wallCount - options.reference.walls.length);
    checks.push(
      check(
        "vs_ref_walls",
        "Wall count vs reference",
        delta <= deltaMax,
        delta,
        `Δ ≤ ${deltaMax} (ref ${options.reference.walls.length})`,
      ),
    );
    const iou =
      bounds && refBounds
        ? aabbIou(
            { minX: bounds.minX, minY: bounds.minY, maxX: bounds.maxX, maxY: bounds.maxY },
            {
              minX: refBounds.minX,
              minY: refBounds.minY,
              maxX: refBounds.maxX,
              maxY: refBounds.maxY,
            },
          )
        : 0;
    checks.push(
      check("vs_ref_bounds", "Bounds IoU vs reference", iou >= iouMin, Number(iou.toFixed(3)), `≥ ${iouMin}`),
    );
  }

  // Short walls are usually noise
  const short = proposal.walls.filter((w) => distMm(w.a, w.b) < 150).length;
  checks.push(check("no_specks", "Few sub-150mm walls", short <= 1, short, "≤ 1"));

  return {
    fixtureId,
    mode,
    pass: checks.every((c) => c.pass),
    wallCount,
    orthoRatio: ortho,
    checks,
  };
}
