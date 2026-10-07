import { describe, expect, it } from "vitest";
import { inspectLivingRoomPlan, isBlockingLivingRoomPlanIssue } from "../livingRoom";
import { instantiateApartmentTemplate } from "./instantiateApartmentTemplate";

const TEMPLATE_IDS = [
  "template:apartment:studio:v1",
  "template:apartment:1bhk:v1",
  "template:apartment:2bhk:v1",
  "template:apartment:3bhk:v1",
];

/**
 * A showcase template must open ready to quote: the proposal gate's Layout row
 * blocks on any error-level plan issue, so none may ship in the authored layouts.
 * Clearance advisories are allowed; they stay visible in Review.
 */
describe("apartment template layout issues", () => {
  it.each(TEMPLATE_IDS)("%s opens with no blocking layout issue", (id) => {
    const project = instantiateApartmentTemplate(id);
    const blocking = inspectLivingRoomPlan(project).filter(isBlockingLivingRoomPlanIssue);
    expect(blocking.map((issue) => issue.message)).toEqual([]);
  });
});
