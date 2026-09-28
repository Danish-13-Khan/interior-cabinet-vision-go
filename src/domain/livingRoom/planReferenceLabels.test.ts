import { describe, expect, it } from "vitest";
import { createGoldenCabinetRunProject } from "./goldenRun/createProject";
import { countPlanLabelOverlaps, planLabelBoxesOverlap } from "./planLabelBoxes";
import {
  layoutReferenceDimensionLabels,
  PLAN_REFERENCE_LABEL_MAX_VISIBLE,
  planObjectTagBoxes,
} from "./planReferenceLabels";
import { collectReferenceDimensions } from "./referenceDimensions";

const format = (mm: number) => `${Math.round(mm)} mm`;

describe("reference label layout — Phase 3 exit gate", () => {
  const project = createGoldenCabinetRunProject();
  const dims = collectReferenceDimensions(project);

  it("golden run has reference dims to place", () => {
    expect(dims.length).toBeGreaterThan(0);
  });

  it("returns one placement per dim in input order", () => {
    const placed = layoutReferenceDimensionLabels(project, dims, format);
    expect(placed.map((label) => label.id)).toEqual(dims.map((dim) => dim.id));
  });

  it("has zero overlapping labels at 100% zoom (tags + visible refs)", () => {
    const placed = layoutReferenceDimensionLabels(project, dims, format);
    const visible = placed.filter((label) => !label.hidden);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThanOrEqual(PLAN_REFERENCE_LABEL_MAX_VISIBLE);
    const tags = planObjectTagBoxes(project);
    expect(countPlanLabelOverlaps(tags)).toBe(0);
    expect(countPlanLabelOverlaps(visible.map((label) => label.box))).toBe(0);
    for (const label of visible) {
      expect(tags.some((tag) => planLabelBoxesOverlap(label.box, tag))).toBe(false);
    }
  });

  it("stays overlap-free with a cabinet selected", () => {
    const cabinet = project.objects.find((object) => object.kind === "cabinet");
    const selectedIds = cabinet ? [cabinet.id] : [];
    const placed = layoutReferenceDimensionLabels(project, dims, format, { selectedIds });
    const tags = planObjectTagBoxes(project, selectedIds);
    const boxes = [...tags, ...placed.filter((label) => !label.hidden).map((label) => label.box)];
    expect(countPlanLabelOverlaps(boxes)).toBe(0);
  });
});
