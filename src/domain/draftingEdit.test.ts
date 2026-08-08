import { describe, expect, it } from "vitest";
import {
  clampProjectDrafting,
  renderCabinetTagSvg,
  renderLeaderSvg,
  renderNoteSvg,
} from "./draftingAnnotations";
import {
  draftHighlightId,
  getDimOffset,
  getTagOffset,
  removeDimOffset,
  upsertDimOffset,
  upsertTagOffset,
} from "./draftingEdit";
import { resolveDimOpts } from "./technicalViews/resolveDimOpts";

describe("draftingEdit offsets", () => {
  it("upserts and removes dim offsets", () => {
    const next = upsertDimOffset([], { id: "plan-overall-w", dx: 4, dy: -6 });
    expect(getDimOffset(next, "plan-overall-w")).toEqual({ dx: 4, dy: -6 });
    expect(removeDimOffset(next, "plan-overall-w")).toEqual([]);
  });

  it("drops zero tag offsets", () => {
    const next = upsertTagOffset(
      [{ cabinetId: "c1", dx: 2, dy: 3 }],
      { cabinetId: "c1", dx: 0, dy: 0 },
    );
    expect(next).toEqual([]);
  });

  it("clamps drafting offsets through project drafting", () => {
    const safe = clampProjectDrafting({
      notes: [],
      leaders: [],
      dimOffsets: [{ id: "d1", dx: 999, dy: -999 }],
      tagOffsets: [{ cabinetId: "cab", dx: 2.34, dy: -1.1 }],
    });
    expect(safe.dimOffsets[0]).toEqual({ id: "d1", dx: 120, dy: -120 });
    expect(getTagOffset(safe.tagOffsets, "cab").dx).toBeCloseTo(2.34, 5);
  });

  it("resolves dim opts with selection highlight", () => {
    const opts = resolveDimOpts(
      {
        notes: [],
        leaders: [],
        dimOffsets: [{ id: "front-overall-h", dx: 5, dy: 0 }],
      },
      "front-overall-h",
      "front-overall-h",
    );
    expect(opts).toMatchObject({
      dimId: "front-overall-h",
      dx: 5,
      dy: 0,
      selected: true,
    });
  });

  it("renders selectable note/leader/tag hit targets", () => {
    const note = renderNoteSvg(10, 20, "Hello", { id: "n1", selected: true }).join("");
    expect(note).toContain('data-note-id="n1"');
    expect(note).toContain("is-selected");

    const leader = renderLeaderSvg(1, 2, 30, 40, "Lead", {
      id: "l1",
      selected: true,
    }).join("");
    expect(leader).toContain('data-leader-id="l1"');
    expect(leader).toContain('data-leader-handle="target"');
    expect(leader).toContain('data-leader-handle="label"');

    const tag = renderCabinetTagSvg(0, 0, "C1", {
      cabinetId: "cab-1",
      selected: true,
    }).join("");
    expect(tag).toContain('data-tag-cabinet-id="cab-1"');
  });

  it("maps draft highlight ids", () => {
    expect(draftHighlightId({ kind: "dim", id: "plan-chain-w" })).toBe("plan-chain-w");
    expect(draftHighlightId({ kind: "tag", cabinetId: "c9" })).toBe("tag-c9");
    expect(draftHighlightId({ kind: "cabinet", id: "c9" })).toBeNull();
  });
});
