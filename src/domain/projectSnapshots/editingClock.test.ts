import { describe, expect, it } from "vitest";
import { EDITING_IDLE_GAP_MS, editingSnapshotDue, noteEdit, shouldSnapshotFirstCabinet } from "./editingClock";
import { SNAPSHOT_INTERVAL_MS } from "./types";

describe("editing snapshot clock", () => {
  it("counts editing time and ignores an idle gap", () => {
    let clock = noteEdit({ accumulatedMs: 0, lastEditAt: null }, 0);
    clock = noteEdit(clock, 30_000);
    expect(clock.accumulatedMs).toBe(30_000);
    clock = noteEdit(clock, 30_000 + EDITING_IDLE_GAP_MS + 1);
    expect(clock.accumulatedMs).toBe(30_000);
    expect(editingSnapshotDue(clock, SNAPSHOT_INTERVAL_MS)).toBe(false);
    clock = { accumulatedMs: SNAPSHOT_INTERVAL_MS - 1_000, lastEditAt: 0 };
    clock = noteEdit(clock, 1_000);
    expect(editingSnapshotDue(clock, SNAPSHOT_INTERVAL_MS)).toBe(true);
  });

  it("does not treat an opened project that already has a cabinet as the first cabinet", () => {
    expect(shouldSnapshotFirstCabinet(0, 1, true)).toBe(false);
    expect(shouldSnapshotFirstCabinet(1, 1, false)).toBe(false);
    expect(shouldSnapshotFirstCabinet(0, 1, false)).toBe(true);
  });
});
