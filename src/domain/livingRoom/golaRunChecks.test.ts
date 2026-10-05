import { describe, expect, it } from "vitest";
import { defaultGolaProfiles, golaParametersPatch } from "../frontSystem";
import type { InteriorProject } from "../interiorProject";
import { setLivingRoomObjectParameters } from "./cabinetFinish";
import { createGoldenCabinetRunProject } from "./goldenRun/createProject";
import { GOLDEN_RUN_OBJECT_IDS as IDS } from "./goldenRun/types";
import { collectGolaReviewIssues, golaFrontsKeepingHandles, golaRunMismatch } from "./golaRunChecks";

const GOLA = golaParametersPatch(defaultGolaProfiles());
const object = (project: InteriorProject, id: string) => project.objects.find((item) => item.id === id)!;

describe("gola run checks", () => {
  it("flags handled base neighbours and offers every run member for Match run", () => {
    const project = setLivingRoomObjectParameters(createGoldenCabinetRunProject(), IDS.baseA, GOLA);
    const mismatch = golaRunMismatch(project, object(project, IDS.baseA))!;
    expect(mismatch.differingIds).toEqual(expect.arrayContaining([IDS.drawer, IDS.baseB]));
    expect(mismatch.differingIds).not.toContain(IDS.baseA);
    expect(mismatch.memberIds).toEqual(expect.arrayContaining(mismatch.differingIds));
    expect(collectGolaReviewIssues(project).some((issue) => issue.code === "gola-run-mismatch")).toBe(true);
  });

  it("matching the run clears the warning; a different L height brings it back", () => {
    let project = setLivingRoomObjectParameters(createGoldenCabinetRunProject(), IDS.baseA, GOLA);
    for (const id of golaRunMismatch(project, object(project, IDS.baseA))!.memberIds) {
      project = setLivingRoomObjectParameters(project, id, GOLA);
    }
    expect(golaRunMismatch(project, object(project, IDS.baseA))).toBeNull();
    project = setLivingRoomObjectParameters(project, IDS.baseB, { golaLHeightMm: 65 });
    expect(golaRunMismatch(project, object(project, IDS.baseA))?.differingIds).toEqual([IDS.baseB]);
  });

  it("handled projects raise no gola warnings", () => {
    const project = createGoldenCabinetRunProject();
    expect(collectGolaReviewIssues(project)).toEqual([]);
    expect(golaFrontsKeepingHandles(object(project, IDS.tall))).toBe(0);
  });

  it("a gola tall unit with no profile on its door is reported as keeping a handle", () => {
    const project = setLivingRoomObjectParameters(createGoldenCabinetRunProject(), IDS.tall, GOLA);
    const handles = golaFrontsKeepingHandles(object(project, IDS.tall));
    expect(handles).toBeGreaterThan(0);
    expect(collectGolaReviewIssues(project).map((issue) => issue.id)).toContain(`gola-handles:${IDS.tall}`);
  });
});
