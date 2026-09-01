import { describe, expect, it } from "vitest";
import { compileBookcase } from "../sceneAdaptersMillwork";
import { createGoldenCabinetRunProject } from "./createProject";
import { measureGoldenRun } from "./metrics";
import { reviseGoldenRunCabinetFinish, reviseGoldenRunCabinetWidth } from "./revision";
import { listGoldenSceneCabinets } from "./sceneSemantics";
import { lossyGoldenObjectIds } from "../handoff";
import { cabinetFinishId } from "../cabinetFinish";
import {
  GOLDEN_RUN_OBJECT_IDS,
  GOLDEN_RUN_ORIGINAL_WIDTH_MM,
  GOLDEN_RUN_REVISED_FINISH_ID,
  GOLDEN_RUN_REVISED_WIDTH_MM,
  GOLDEN_RUN_WALL_MOUNT_Y_MM,
} from "./types";

describe("golden cabinet run width revision", () => {
  it("updates 3D semantics, quote, and cutlist from one width edit", () => {
    const project = createGoldenCabinetRunProject();
    const before = measureGoldenRun(project);
    expect(before.revisedCabinetWidthMm).toBe(GOLDEN_RUN_ORIGINAL_WIDTH_MM);
    expect(before.sellTotal).toBeGreaterThan(0);
    expect(before.cutlistPartCount).toBeGreaterThan(0);

    const revised = reviseGoldenRunCabinetWidth(project);
    const after = measureGoldenRun(revised);
    expect(after.revisedCabinetWidthMm).toBe(GOLDEN_RUN_REVISED_WIDTH_MM);
    expect(after.sellTotal).not.toBe(before.sellTotal);
    expect(after.fingerprint).not.toBe(before.fingerprint);
    expect(after.cutlistWidthSum).not.toBe(before.cutlistWidthSum);
    expect(after.countertopId).toBe(before.countertopId);
    expect(after.countertopWidthMm).not.toBe(before.countertopWidthMm);
    expect(after.cabinetIds).toEqual(before.cabinetIds);
    expect(after.engineeringIds).toEqual(before.engineeringIds);
    expect(after.revision).toBe(before.revision);
  });

  it("keeps family-distinct shared geometry after the width revision", () => {
    const project = reviseGoldenRunCabinetWidth(createGoldenCabinetRunProject());
    const scene = listGoldenSceneCabinets(project);
    const byId = Object.fromEntries(scene.map((item) => [item.objectId, item]));
    const base = byId[GOLDEN_RUN_OBJECT_IDS.baseA]!;
    const wall = byId[GOLDEN_RUN_OBJECT_IDS.wallA]!;
    const drawer = byId[GOLDEN_RUN_OBJECT_IDS.drawer]!;
    const tall = byId[GOLDEN_RUN_OBJECT_IDS.tall]!;
    expect(base.geometry).toBe("shared-cabinet");
    expect(base.widthMm).toBe(GOLDEN_RUN_REVISED_WIDTH_MM);
    expect(base.roles).toContain("fronts");
    expect(base.roles).toContain("toe-kick");
    expect(wall.yMm).toBe(GOLDEN_RUN_WALL_MOUNT_Y_MM);
    expect(wall.roles).not.toContain("toe-kick");
    expect(drawer.roles).toContain("fronts");
    expect(tall.roles.length).toBeGreaterThan(1);
    const object = project.objects.find((item) => item.id === GOLDEN_RUN_OBJECT_IDS.baseA)!;
    const bookcaseIds = compileBookcase(object).map((part) => part.id).sort().join(",");
    expect(scene.map((item) => item.familyId).sort().join("|")).not.toContain("bookcase");
    expect(bookcaseIds.length).toBeGreaterThan(0);
    expect(new Set(scene.map((item) => item.roles.join("|"))).size).toBeGreaterThan(1);
  });

  it("keeps a finish change on planning rules without adapter loss", () => {
    const project = createGoldenCabinetRunProject();
    const before = measureGoldenRun(project);
    const revised = reviseGoldenRunCabinetFinish(project);
    const object = revised.objects.find((item) => item.id === GOLDEN_RUN_OBJECT_IDS.baseA)!;
    expect(cabinetFinishId(object)).toBe(GOLDEN_RUN_REVISED_FINISH_ID);
    expect(object.materialSlots).toEqual({});
    expect(lossyGoldenObjectIds(revised)).toEqual([]);
    const after = measureGoldenRun(revised);
    expect(after.sellTotal).not.toBe(before.sellTotal);
    expect(after.engineeringIds).toEqual(before.engineeringIds);
  });
});
