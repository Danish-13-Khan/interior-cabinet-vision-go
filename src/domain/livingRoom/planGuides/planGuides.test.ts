import { describe, expect, it } from "vitest";
import { loadInteriorProjectFile, serializeInteriorProjectFile } from "../../interiorProject";
import { createLivingRoomStarterProject } from "../preset";
import { setLivingRoomPlanUnderlay } from "../planUnderlay";
import {
  addPlanGuide,
  getPlanGuides,
  nextPlanGuideLabel,
  removePlanGuide,
  shouldShowAutoCenterLine,
  snapPointToGuides,
  updatePlanGuide,
  type PlanGuide,
} from ".";

const NOW = "2026-10-05T12:00:00.000Z";
const project = () => createLivingRoomStarterProject({ now: NOW });

describe("plan guides (Phase 3)", () => {
  it("labels vertical guides A, B… and horizontal guides 1, 2…", () => {
    let next = addPlanGuide(project(), { axis: "x", positionMm: -2000, id: "g1" });
    next = addPlanGuide(next, { axis: "x", positionMm: 0, id: "g2" });
    next = addPlanGuide(next, { axis: "z", positionMm: 1500.4, id: "g3" });
    expect(getPlanGuides(next).map((guide) => [guide.label, guide.positionMm])).toEqual([
      ["A", -2000], ["B", 0], ["1", 1500],
    ]);
    const reused = removePlanGuide(next, "g1");
    expect(nextPlanGuideLabel(getPlanGuides(reused), "x")).toBe("A");
  });

  it("moves, relabels, locks and removes", () => {
    let next = addPlanGuide(project(), { axis: "z", positionMm: 100, id: "g" });
    next = updatePlanGuide(next, "g", { positionMm: 250, label: "  CL " });
    expect(getPlanGuides(next)[0]).toMatchObject({ positionMm: 250, label: "CL" });
    next = updatePlanGuide(next, "g", { locked: true });
    expect(updatePlanGuide(next, "g", { positionMm: 900 })).toBe(next);
    expect(getPlanGuides(updatePlanGuide(next, "g", { label: "2" }))[0]!.label).toBe("2");
    expect(getPlanGuides(removePlanGuide(next, "g"))).toEqual([]);
    expect(removePlanGuide(next, "g").extensions?.planGuides).toBeUndefined();
  });

  it("survives underlay replace / remove and save → reopen", () => {
    let next = addPlanGuide(project(), { axis: "x", positionMm: 1200, id: "g" });
    const underlay = {
      fileName: "a.png", dataUrl: "data:image/png;base64,AAAA", widthMm: 5000, heightMm: 4000, opacity: 0.5,
    };
    next = setLivingRoomPlanUnderlay(next, underlay);
    next = setLivingRoomPlanUnderlay(next, { ...underlay, fileName: "b.png" });
    next = setLivingRoomPlanUnderlay(next, null);
    expect(getPlanGuides(next)).toHaveLength(1);
    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(next, NOW)).document;
    expect(getPlanGuides(reopened)).toEqual([{ id: "g", axis: "x", positionMm: 1200, label: "A" }]);
  });

  it("ignores malformed stored guides", () => {
    const broken = { ...project(), extensions: { planGuides: [{ id: "x", axis: "y", positionMm: 1 }, null, { id: "ok", axis: "z", positionMm: 5 }] } };
    expect(getPlanGuides(broken).map((guide) => guide.id)).toEqual(["ok"]);
  });
});

describe("guide snapping", () => {
  const guides: PlanGuide[] = [
    { id: "a", axis: "x", positionMm: 1000 },
    { id: "b", axis: "z", positionMm: -500 },
  ];

  it("pulls each axis onto the nearest guide within tolerance", () => {
    expect(snapPointToGuides({ x: 1000, z: 300 }, { x: 1030, z: 310 }, guides, 50)).toEqual({ x: 1000, z: 300 });
    expect(snapPointToGuides({ x: 950, z: -450 }, { x: 970, z: -470 }, guides, 50)).toEqual({ x: 1000, z: -500 });
    expect(snapPointToGuides({ x: 900, z: 0 }, { x: 900, z: 0 }, guides, 50)).toEqual({ x: 900, z: 0 });
  });

  it("keeps a point that already landed on a wall node instead of pulling it onto a guide", () => {
    const node = { x: 1020, z: 300 };
    expect(snapPointToGuides(node, { x: 1025, z: 305 }, guides, 50, [node])).toEqual(node);
    expect(snapPointToGuides({ x: 1050, z: 300 }, { x: 1030, z: 305 }, guides, 50, [node])).toEqual({ x: 1000, z: 300 });
  });

  it("shows the automatic centre line only without guides and when enabled", () => {
    expect(shouldShowAutoCenterLine([], undefined)).toBe(true);
    expect(shouldShowAutoCenterLine([], false)).toBe(false);
    expect(shouldShowAutoCenterLine(guides, true)).toBe(false);
  });
});
