import { describe, expect, it } from "vitest";
import { createGoldenCabinetRunProject } from "./goldenRun/createProject";
import { collectModelQualityIssues, type ModelQualityIssue } from "./modelQualityFeedback";
import { inspectLivingRoomPlan } from "./planConstraints";
import { groupReviewIssues, mergeNumericMessages, reviewIssueCounts } from "./reviewIssueGroups";

const project = createGoldenCabinetRunProject();
const layout = inspectLivingRoomPlan(project);
const model = collectModelQualityIssues(project);

describe("groupReviewIssues — Phase 6 exit gate", () => {
  const groups = groupReviewIssues(project, layout, model);

  it("golden run review list is at most 10 grouped rows", () => {
    expect(layout.length + model.length).toBeGreaterThan(0);
    expect(groups.length).toBeLessThanOrEqual(10);
    expect(groups.length).toBeLessThanOrEqual(layout.length + model.length);
  });

  it("every row selects at least one real object", () => {
    const ids = new Set(project.objects.map((object) => object.id));
    for (const group of groups) {
      expect(group.objectIds.length).toBeGreaterThan(0);
      expect(group.objectIds.every((id) => ids.has(id))).toBe(true);
    }
  });

  it("keeps every issue: grouped counts add up to the raw list", () => {
    expect(groups.reduce((total, group) => total + group.count, 0)).toBe(layout.length + model.length);
  });

  it("orders blocking before warnings before notes", () => {
    const order = groups.map((group) => ({ blocking: 0, warning: 1, info: 2 })[group.severity]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe("grouping rules", () => {
  const issue = (objectId: string, title: string): ModelQualityIssue => ({
    id: `x:${objectId}`, code: "assembly-shelf-span", severity: "warning", title, detail: "Assembly warning",
    objectId, blocking: false, kind: "assembly",
  });

  it("collapses the same check on several cabinets into one row with a range", () => {
    const [a, b, c] = project.objects.filter((object) => object.kind === "cabinet");
    const groups = groupReviewIssues(project, [], [
      issue(a!.id, `${a!.name}: shelf span 864 mm exceeds 800 mm`),
      issue(b!.id, `${b!.name}: shelf span 910 mm exceeds 800 mm`),
      issue(c!.id, `${c!.name}: shelf span 880 mm exceeds 800 mm`),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.title).toBe("3 cabinets: shelf span 864–910 mm exceeds 800 mm");
    expect(groups[0]!.objectIds).toEqual([a!.id, b!.id, c!.id]);
    expect(reviewIssueCounts(groups)).toEqual({ blocking: 0, warnings: 3, notes: 0 });
  });

  it("keeps a single issue's own wording and object name", () => {
    const [a] = project.objects;
    const groups = groupReviewIssues(project, [], [issue(a!.id, `${a!.name}: shelf span 864 mm exceeds 800 mm`)]);
    expect(groups[0]!.title).toBe(`${a!.name}: shelf span 864 mm exceeds 800 mm`);
  });

  it("mergeNumericMessages falls back to the first message when wording differs", () => {
    expect(mergeNumericMessages(["gap 10 mm", "gap 30 mm"])).toBe("gap 10–30 mm");
    expect(mergeNumericMessages(["gap 10 mm", "overlap 30 mm"])).toBe("gap 10 mm");
  });
});
