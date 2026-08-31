import { describe, expect, it } from "vitest";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
} from "../../interiorProject";
import { createExportableProjectCutlist } from "../../productionOutputs";
import { freezeProposal } from "../proposal";
import { buildLiveInteriorQuote } from "../proposal/liveQuote";
import { createGoldenCabinetRunProject } from "./createProject";
import {
  GOLDEN_RUN_COUNTERTOP_ID,
  GOLDEN_RUN_COUNTERTOP_WIDTH_MM,
  goldenRunCountertopWidthMm,
  readGoldenRunCountertop,
} from "./countertops";
import { measureGoldenRun } from "./metrics";
import { reviseGoldenRunCabinetWidth } from "./revision";
import { listGoldenSceneCountertops } from "./sceneSemantics";
import { serializeGoldenRunFixture, loadGoldenRunFixture } from "./serialize";
import {
  GOLDEN_CABINET_RUN_NOW,
  GOLDEN_RUN_COUNTERTOP_CABINET_IDS,
  GOLDEN_RUN_COUNTERTOP_DEPTH_MM,
  GOLDEN_RUN_COUNTERTOP_THICKNESS_MM,
  GOLDEN_RUN_OBJECT_IDS,
  GOLDEN_RUN_REVISED_WIDTH_MM,
} from "./types";

describe("golden run countertop fixture", () => {
  it("is deterministic with a stable id, dimensions, and host cabinet ids", () => {
    const first = readGoldenRunCountertop(createGoldenCabinetRunProject());
    const second = readGoldenRunCountertop(createGoldenCabinetRunProject());
    expect(first).toEqual(second);
    expect(first.id).toBe(GOLDEN_RUN_COUNTERTOP_ID);
    expect(first.cabinetIds).toEqual([...GOLDEN_RUN_COUNTERTOP_CABINET_IDS]);
    expect(first.widthMm).toBe(GOLDEN_RUN_COUNTERTOP_WIDTH_MM);
    expect(first.depthMm).toBe(GOLDEN_RUN_COUNTERTOP_DEPTH_MM);
    expect(first.thicknessMm).toBe(GOLDEN_RUN_COUNTERTOP_THICKNESS_MM);
    expect(first.cabinetIds).not.toContain(GOLDEN_RUN_OBJECT_IDS.tall);
    const scene = listGoldenSceneCountertops(createGoldenCabinetRunProject());
    expect(scene).toHaveLength(1);
    expect(scene[0]?.id).toBe(GOLDEN_RUN_COUNTERTOP_ID);
    expect(scene[0]?.widthMm).toBe(GOLDEN_RUN_COUNTERTOP_WIDTH_MM);
  });

  it("survives interiors save/reopen with the same quote and cutlist hosts", () => {
    const project = createGoldenCabinetRunProject();
    const before = measureGoldenRun(project);
    const adapted = cabinetProjectFromInteriorProject(project);
    const saved = interiorProjectFromCabinetProject({
      project: adapted.project,
      activeRoom: adapted.room,
      now: GOLDEN_CABINET_RUN_NOW,
    });
    const reopened = loadGoldenRunFixture(serializeGoldenRunFixture(saved));
    const after = measureGoldenRun(reopened);
    expect(after.countertopId).toBe(GOLDEN_RUN_COUNTERTOP_ID);
    expect(after.countertopWidthMm).toBe(before.countertopWidthMm);
    expect(after.countertopCabinetIds).toEqual(before.countertopCabinetIds);
    expect(after.sellTotal).toBe(before.sellTotal);
    expect(after.cutlistPartCount).toBe(before.cutlistPartCount);
    const lines = createExportableProjectCutlist(
      cabinetProjectFromInteriorProject(reopened).project,
    );
    for (const id of GOLDEN_RUN_COUNTERTOP_CABINET_IDS) {
      expect(lines.some((line) => line.cabinetId === id)).toBe(true);
    }
  });

  it("moves quote, cutlist, and countertop width from one host width edit", () => {
    const project = createGoldenCabinetRunProject();
    const before = measureGoldenRun(project);
    const revised = reviseGoldenRunCabinetWidth(project);
    const after = measureGoldenRun(revised);
    expect(after.countertopId).toBe(GOLDEN_RUN_COUNTERTOP_ID);
    expect(after.countertopWidthMm).toBe(goldenRunCountertopWidthMm(GOLDEN_RUN_REVISED_WIDTH_MM));
    expect(after.countertopWidthMm).not.toBe(before.countertopWidthMm);
    expect(after.sellTotal).not.toBe(before.sellTotal);
    expect(after.cutlistWidthSum).not.toBe(before.cutlistWidthSum);
    expect(buildLiveInteriorQuote(revised).quote.sellTotal).toBe(after.sellTotal);
    expect(freezeProposal(revised, GOLDEN_CABINET_RUN_NOW)).toBeTruthy();
  });
});
