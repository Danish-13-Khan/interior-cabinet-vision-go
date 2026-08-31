import { describe, expect, it } from "vitest";
import { createGoldenCabinetRunProject } from "./createProject";
import { GOLDEN_WORKFLOW_CANVAS_ALTERNATIVES } from "./canvasAlternatives";
import { GOLDEN_RUN_OBJECT_IDS } from "./types";
import { nextSelectableObjectId, selectableObjectIds } from "../objectSelection";

describe("golden workflow canvas alternatives", () => {
  it("covers every golden canvas action with an inspector or keyboard path", () => {
    expect(GOLDEN_WORKFLOW_CANVAS_ALTERNATIVES.map((row) => row.action)).toEqual([
      "select-cabinet",
      "move-cabinet",
      "resize-cabinet",
      "rotate-cabinet",
      "change-finish",
    ]);
    expect(GOLDEN_WORKFLOW_CANVAS_ALTERNATIVES.every((row) => row.alternative.length > 0)).toBe(true);
  });

  it("cycles golden cabinets without requiring a canvas click", () => {
    const project = createGoldenCabinetRunProject();
    const ids = selectableObjectIds(project.objects, project.activeRoomId);
    expect(ids).toContain(GOLDEN_RUN_OBJECT_IDS.baseA);
    expect(nextSelectableObjectId(project.objects, null, 1, project.activeRoomId)).toBe(ids[0]);
    const after = nextSelectableObjectId(
      project.objects,
      GOLDEN_RUN_OBJECT_IDS.baseA,
      1,
      project.activeRoomId,
    );
    expect(after).toBeTruthy();
    expect(after).not.toBe(GOLDEN_RUN_OBJECT_IDS.baseA);
  });
});
