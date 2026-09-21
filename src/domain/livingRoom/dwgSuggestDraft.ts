import {
  clampWallHeightMm,
  clampWallThicknessMm,
  DEFAULT_WALL_HEIGHT_MM,
  DEFAULT_WALL_THICKNESS_MM,
  type Point2Mm,
} from "../interiorProject";
import { DWG_SUGGEST_JOIN_MM, type DwgSuggestCenterline } from "./dwgSuggestNormalize";

export type DwgSuggestCandidate = DwgSuggestCenterline & {
  id: string;
  chainId: string;
  closed: boolean;
  accepted: boolean;
};

export type DwgSuggestDraft = {
  candidates: DwgSuggestCandidate[];
  thicknessMm: number;
  heightMm: number;
};

function same(a: Point2Mm, b: Point2Mm) {
  return Math.hypot(a.x - b.x, a.z - b.z) <= DWG_SUGGEST_JOIN_MM;
}

function reverse(segment: DwgSuggestCenterline): DwgSuggestCenterline {
  return { a: segment.b, b: segment.a, layer: segment.layer };
}

type Run = DwgSuggestCenterline[];

function attach(run: Run, leftover: DwgSuggestCenterline[]): boolean {
  const head = run[0]!.a;
  const tail = run[run.length - 1]!.b;
  const index = leftover.findIndex((segment) => (
    same(segment.a, tail) || same(segment.b, tail) || same(segment.a, head) || same(segment.b, head)
  ));
  if (index < 0) return false;
  const [segment] = leftover.splice(index, 1);
  if (same(segment!.a, tail)) run.push(segment!);
  else if (same(segment!.b, tail)) run.push(reverse(segment!));
  else if (same(segment!.b, head)) run.unshift(segment!);
  else run.unshift(reverse(segment!));
  return true;
}

export function chainDwgSuggestSegments(segments: DwgSuggestCenterline[]): Run[] {
  const leftover = [...segments];
  const runs: Run[] = [];
  while (leftover.length) {
    const run: Run = [leftover.shift()!];
    while (attach(run, leftover)) { /* grow both ends */ }
    runs.push(run);
  }
  return runs;
}

export function buildDwgSuggestDraft(
  segments: DwgSuggestCenterline[],
  options?: { thicknessMm?: number; heightMm?: number },
): DwgSuggestDraft {
  const thicknessMm = clampWallThicknessMm(options?.thicknessMm ?? DEFAULT_WALL_THICKNESS_MM);
  const heightMm = clampWallHeightMm(options?.heightMm ?? DEFAULT_WALL_HEIGHT_MM);
  const candidates: DwgSuggestCandidate[] = [];
  chainDwgSuggestSegments(segments).forEach((run, chainIndex) => {
    const closed = run.length >= 3 && same(run[0]!.a, run[run.length - 1]!.b);
    const chainId = `chain-${chainIndex + 1}`;
    run.forEach((segment, index) => {
      candidates.push({
        ...segment,
        id: `${chainId}:seg-${index + 1}`,
        chainId,
        closed,
        accepted: true,
      });
    });
  });
  return { candidates, thicknessMm, heightMm };
}

export function acceptedDwgSuggestCandidates(draft: DwgSuggestDraft | null): DwgSuggestCandidate[] {
  return draft?.candidates.filter((candidate) => candidate.accepted) ?? [];
}

export function setDwgSuggestCandidateAccepted(
  draft: DwgSuggestDraft,
  candidateId: string,
  accepted: boolean,
): DwgSuggestDraft {
  return {
    ...draft,
    candidates: draft.candidates.map((candidate) => (
      candidate.id === candidateId ? { ...candidate, accepted } : candidate
    )),
  };
}

export function setDwgSuggestDraftAccepted(draft: DwgSuggestDraft, accepted: boolean): DwgSuggestDraft {
  return {
    ...draft,
    candidates: draft.candidates.map((candidate) => ({ ...candidate, accepted })),
  };
}
