import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAsciiDxf } from "./dwgDxfParse";
import { buildDwgPreview, dwgPreviewDataUrl } from "./dwgGeometry";
import { extractDwgSuggestCenterlines } from "./dwgSuggestCenterlines";
import {
  acceptedDwgSuggestCandidates,
  buildDwgSuggestDraft,
  chainDwgSuggestSegments,
  setDwgSuggestCandidateAccepted,
} from "./dwgSuggestDraft";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

function roomUnderlay(): LivingRoomPlanUnderlay {
  const preview = buildDwgPreview(parseAsciiDxf(readFileSync("tests/fixtures/dwg/room_4000x3000.dxf", "utf8")));
  return {
    sourceType: "dwg",
    fileName: "room_4000x3000.dxf",
    dataUrl: dwgPreviewDataUrl(preview),
    widthMm: 4000,
    heightMm: 3000,
    opacity: 0.42,
    dwg: { preview, hiddenLayers: [] },
  };
}

describe("DWG suggest draft", () => {
  it("groups the taped room into one closed chain of accepted candidates", () => {
    const segments = extractDwgSuggestCenterlines(roomUnderlay()).segments;
    const draft = buildDwgSuggestDraft(segments, { thicknessMm: 120, heightMm: 2800 });
    expect(chainDwgSuggestSegments(segments)).toHaveLength(1);
    expect(draft.candidates).toHaveLength(6);
    expect(draft.candidates.every((item) => item.closed && item.accepted)).toBe(true);
    expect(draft.thicknessMm).toBe(120);
    expect(draft.heightMm).toBe(2800);
  });

  it("keeps a two-segment L as an open run", () => {
    const runs = chainDwgSuggestSegments([
      { layer: "Walls", a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } },
      { layer: "Walls", a: { x: 1000, z: 0 }, b: { x: 1000, z: 800 } },
    ]);
    expect(runs).toHaveLength(1);
    const draft = buildDwgSuggestDraft(runs[0]!);
    expect(draft.candidates.every((item) => !item.closed)).toBe(true);
    expect(draft.candidates).toHaveLength(2);
  });

  it("toggles accept without dropping the candidate", () => {
    const draft = buildDwgSuggestDraft([
      { layer: "Walls", a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } },
    ]);
    const next = setDwgSuggestCandidateAccepted(draft, draft.candidates[0]!.id, false);
    expect(acceptedDwgSuggestCandidates(next)).toEqual([]);
    expect(next.candidates).toHaveLength(1);
  });
});
