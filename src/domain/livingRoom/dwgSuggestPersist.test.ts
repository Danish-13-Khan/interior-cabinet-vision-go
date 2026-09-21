import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadInteriorProjectFile, serializeInteriorProjectFile } from "../interiorProject";
import { applyDwgSuggestDraft } from "./dwgSuggestApply";
import { extractDwgSuggestCenterlines } from "./dwgSuggestCenterlines";
import { buildDwgSuggestDraft } from "./dwgSuggestDraft";
import { parseAsciiDxf } from "./dwgDxfParse";
import { buildDwgPreview, dwgPreviewDataUrl } from "./dwgGeometry";
import { applyPlannerStarterTemplate } from "./plannerStarters";
import {
  getLivingRoomPlanUnderlay,
  persistLivingRoomPlanUnderlay,
  setLivingRoomPlanUnderlay,
  type LivingRoomPlanUnderlay,
} from "./planUnderlay";
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
    xMm: 25,
    zMm: -10,
    rotationDeg: 5,
    calibrated: true,
    dwg: { preview, hiddenLayers: [] },
  };
}

describe("DWG suggest save/reopen", () => {
  it("keeps the tracing and applied walls, not the session draft", () => {
    const underlay = roomUnderlay();
    const draft = {
      ...buildDwgSuggestDraft(extractDwgSuggestCenterlines(underlay).segments),
      fingerprint: "session-only",
    };
    const saved = applyDwgSuggestDraft(
      setLivingRoomPlanUnderlay(
        applyPlannerStarterTemplate(createLivingRoomStarterProject({ now: "2026-09-21T00:00:00.000Z" }), "blank-room"),
        { ...underlay, fingerprint: "leak" } as LivingRoomPlanUnderlay,
      ),
      draft,
    );
    const json = serializeInteriorProjectFile(saved, "2026-09-21T00:00:00.000Z");
    expect(json).not.toContain("session-only");
    expect(json).not.toContain('"fingerprint"');
    expect(json).not.toContain("chain-1:seg");
    expect(json).toContain("dwg-suggest");
    const raw = persistLivingRoomPlanUnderlay({ ...underlay, fingerprint: "leak" } as LivingRoomPlanUnderlay);
    expect(raw.dataUrl).toBe("");
    expect("fingerprint" in raw).toBe(false);
    const opened = loadInteriorProjectFile(json).document;
    expect(opened.walls).toHaveLength(6);
    expect(getLivingRoomPlanUnderlay(opened)).toMatchObject({
      fileName: "room_4000x3000.dxf",
      xMm: 25,
      zMm: -10,
      rotationDeg: 5,
      calibrated: true,
    });
    expect(extractDwgSuggestCenterlines(getLivingRoomPlanUnderlay(opened)).segments).toHaveLength(6);
  });
});
