import { wallLengthMm } from "./planTopology";
import type { InteriorValidationIssue, OpeningEntity, WallEntity } from "./types";

function issue(issues: InteriorValidationIssue[], value: Omit<InteriorValidationIssue, "repaired">) {
  issues.push({ ...value, repaired: false });
}

export function validateTopologyOpenings(
  openings: OpeningEntity[],
  wallsById: Map<string, WallEntity>,
  issues: InteriorValidationIssue[],
) {
  const byWall = new Map<string, OpeningEntity[]>();
  for (const opening of openings) {
    const wall = wallsById.get(opening.wallId);
    if (!wall) {
      issue(issues, {
        severity: "error", code: "opening-unknown-wall", path: `openings.${opening.id}`,
        message: "Opening references an unknown wall.",
      });
      continue;
    }
    const length = wallLengthMm(wall);
    if (opening.offsetMm < 0 || opening.offsetMm + opening.widthMm > length + 0.5) {
      issue(issues, {
        severity: "warning", code: "opening-out-of-range", path: `openings.${opening.id}`,
        message: "Opening extent should lie within the host wall length.",
      });
    }
    byWall.set(opening.wallId, [...(byWall.get(opening.wallId) ?? []), opening]);
  }
  for (const [wallId, list] of byWall) {
    const sorted = [...list].sort((a, b) => a.offsetMm - b.offsetMm);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1]!;
      const next = sorted[index]!;
      if (previous.offsetMm + previous.widthMm <= next.offsetMm + 0.5) continue;
      issue(issues, {
        severity: "warning", code: "opening-overlap", path: `openings.${next.id}`,
        message: `Opening overlaps another opening on wall ${wallId}.`,
      });
    }
  }
}
