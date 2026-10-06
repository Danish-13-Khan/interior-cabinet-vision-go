import { describe, expect, it } from "vitest";
import { createRoomSceneCache } from "../livingRoom/roomSceneCache";
import { instantiateApartmentTemplate } from "../apartmentTemplates/instantiateApartmentTemplate";
import { COMPOSER_TEST_NOW } from "../apartmentTemplates/composers/bareRoom";
import { cardCapturePathsForProject } from "./cardCapturePaths";
import { resolveCardCaptureView } from "./cameraPaths";

describe("card capture camera paths", () => {
  const project = instantiateApartmentTemplate("template:apartment:2bhk:v1", { now: COMPOSER_TEST_NOW });
  const sceneFor = createRoomSceneCache(project);

  it("lists apartment paths including overview glide", () => {
    expect(cardCapturePathsForProject(project)).toEqual(["hero", "overview", "overview-to-hero", "room-arc"]);
  });

  it("returns identical hero poses for the same t", () => {
    const a = resolveCardCaptureView(project, sceneFor, "hero", 1);
    const b = resolveCardCaptureView(project, sceneFor, "hero", 1);
    expect(a.pose).toEqual(b.pose);
  });

  it("keeps the authored wide living showcase height for apartment heroes", () => {
    const view = resolveCardCaptureView(project, sceneFor, "hero", 1);
    expect(view.pose.position.y).toBeGreaterThan(2);
  });

  it("eases overview-to-hero between endpoints", () => {
    const start = resolveCardCaptureView(project, sceneFor, "overview-to-hero", 0);
    const end = resolveCardCaptureView(project, sceneFor, "overview-to-hero", 1);
    expect(start.overview).toBe(true);
    expect(end.overview).toBe(false);
    expect(start.pose.position).not.toEqual(end.pose.position);
  });
});
