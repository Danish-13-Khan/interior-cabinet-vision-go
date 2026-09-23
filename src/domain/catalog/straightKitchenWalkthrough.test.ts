import { describe, expect, it } from "vitest";
import { instantiateStraightKitchenCatalogTemplate } from ".";
import { lossyGoldenObjectIds } from "../livingRoom/handoff";
import { inspectLivingRoomPlan, isBlockingLivingRoomPlanIssue } from "../livingRoom/planConstraints";

describe("straight kitchen proposal walkthrough", () => {
  it("keeps the stock kitchen free of blocking layout and handoff loss", () => {
    const project = instantiateStraightKitchenCatalogTemplate({
      projectId: "sk-walk",
      projectName: "Straight Kitchen",
      now: "2026-09-23T12:00:00.000Z",
    });
    expect(inspectLivingRoomPlan(project).filter(isBlockingLivingRoomPlanIssue)).toEqual([]);
    expect(lossyGoldenObjectIds(project)).toEqual([]);
  });
});
