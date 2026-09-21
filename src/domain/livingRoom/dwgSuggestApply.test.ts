import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { drawRoomFromPoints, rectanglePoints } from "../interiorProject";
import { parseAsciiDxf } from "./dwgDxfParse";
import { applyDwgSuggestDraft } from "./dwgSuggestApply";
import { extractDwgSuggestCenterlines } from "./dwgSuggestCenterlines";
import {
  buildDwgSuggestDraft,
  setDwgSuggestCandidateAccepted,
} from "./dwgSuggestDraft";
import { applyDwgSuggestOverlap } from "./dwgSuggestOverlap";
import { buildDwgPreview, dwgPreviewDataUrl } from "./dwgGeometry";
import { applyPlannerStarterTemplate } from "./plannerStarters";
import { setLivingRoomPlanUnderlay, type LivingRoomPlanUnderlay } from "./planUnderlay";
import { createLivingRoomStarterProject } from "./preset";

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

function blank() {
  return setLivingRoomPlanUnderlay(
    applyPlannerStarterTemplate(createLivingRoomStarterProject({ now: "2026-09-21T00:00:00.000Z" }), "blank-room"),
    roomUnderlay(),
  );
}

function hostRoom() {
  return drawRoomFromPoints(blank(), {
    kind: "rectangle",
    points: rectanglePoints({ x: -4000, z: -4000 }, { x: -1000, z: -2000 }),
  }, { raised: true });
}

describe("DWG suggest apply", () => {
  it("writes the taped room as one raised wall graph with draft thickness", () => {
    const draft = buildDwgSuggestDraft(extractDwgSuggestCenterlines(roomUnderlay()).segments, {
      thicknessMm: 150,
      heightMm: 3000,
    });
    const next = applyDwgSuggestDraft(blank(), draft);
    expect(next.walls).toHaveLength(6);
    expect(next.rooms).toHaveLength(1);
    expect(next.walls.every((wall) => wall.thicknessMm === 150 && wall.heightMm === 3000 && wall.raised)).toBe(true);
    expect(next.walls.every((wall) => wall.extensions?.createdBy === "dwg-suggest")).toBe(true);
  });

  it("skips covered candidates on re-apply and ignores a rejected open run", () => {
    const draft = buildDwgSuggestDraft(extractDwgSuggestCenterlines(roomUnderlay()).segments);
    const first = applyDwgSuggestDraft(blank(), draft);
    const again = applyDwgSuggestDraft(first, applyDwgSuggestOverlap(draft, first.walls));
    expect(again.walls).toHaveLength(first.walls.length);
    const host = hostRoom();
    const open = buildDwgSuggestDraft([{ layer: "Walls", a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } }]);
    const rejected = setDwgSuggestCandidateAccepted(open, open.candidates[0]!.id, false);
    expect(applyDwgSuggestDraft(host, rejected).walls).toHaveLength(host.walls.length);
  });

  it("adds an open run with createWallSegment once a room exists", () => {
    const host = hostRoom();
    const draft = buildDwgSuggestDraft([
      { layer: "Walls", a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } },
      { layer: "Walls", a: { x: 1000, z: 0 }, b: { x: 1000, z: 800 } },
    ]);
    const next = applyDwgSuggestDraft(host, draft);
    expect(next.walls.length - host.walls.length).toBe(2);
  });

  it("applies an open run on a blank site without inventing closing walls", () => {
    const draft = buildDwgSuggestDraft([
      { layer: "Walls", a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } },
    ]);
    const next = applyDwgSuggestDraft(blank(), draft);
    expect(next.rooms).toHaveLength(1);
    expect(next.walls).toHaveLength(1);
    expect(next.walls[0]).toMatchObject({
      start: { x: 0, z: 0 },
      end: { x: 1000, z: 0 },
      extensions: { createdBy: "dwg-suggest" },
    });
  });

  it("applies the remaining walls when one side of a closed chain is rejected", () => {
    const draft = buildDwgSuggestDraft(extractDwgSuggestCenterlines(roomUnderlay()).segments);
    const rejected = setDwgSuggestCandidateAccepted(draft, draft.candidates[0]!.id, false);
    const next = applyDwgSuggestDraft(blank(), rejected);
    expect(next.walls).toHaveLength(5);
  });
});
