import { describe, expect, it } from "vitest";
import {
  instantiateBathroomCatalogTemplate,
  instantiateBedroomCatalogTemplate,
  instantiateLKitchenCatalogTemplate,
  instantiateLivingRoomCatalogTemplate,
  instantiateStraightKitchenCatalogTemplate,
} from "./instantiateNamedCatalogTemplates";
import { inspectLivingRoomPlan } from "../livingRoom/planConstraints";
import {
  collectModelQualityIssues,
  modelQualityBlockingCount,
} from "../livingRoom/modelQualityFeedback";
import type { InteriorProject } from "../interiorProject";

const NOW = "2026-09-24T00:00:00.000Z";

const TEMPLATES: Array<[string, () => InteriorProject]> = [
  ["living room", () => instantiateLivingRoomCatalogTemplate({ projectId: "lr-checks", now: NOW })],
  ["bathroom", () => instantiateBathroomCatalogTemplate({ projectId: "bath-checks", now: NOW })],
  ["bedroom", () => instantiateBedroomCatalogTemplate({ projectId: "bed-checks", now: NOW })],
  ["straight kitchen", () => instantiateStraightKitchenCatalogTemplate({ projectId: "sk-checks", now: NOW })],
  ["l kitchen", () => instantiateLKitchenCatalogTemplate({ projectId: "lk-checks", now: NOW })],
];

describe("catalog template plan and model checks", () => {
  it.each(TEMPLATES)("%s opens with no layout issues and no blocking model-quality issues", (_name, make) => {
    const project = make();
    const layout = inspectLivingRoomPlan(project);
    const model = collectModelQualityIssues(project);
    expect(layout).toEqual([]);
    expect(modelQualityBlockingCount(model)).toBe(0);
    expect(model.filter((issue) => issue.severity === "error" || issue.blocking)).toEqual([]);
  });
});
