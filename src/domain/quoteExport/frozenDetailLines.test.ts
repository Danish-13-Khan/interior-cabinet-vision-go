import { describe, expect, it } from "vitest";
import { clampQuoteSnapshot, QUOTE_SNAPSHOT_DETAIL_LIMIT } from "../quoteSettings";
import { csvFromFrozenSnapshot } from "./csvRows";

const base = {
  id: "quote-1", revision: "A", sellTotal: 1000, workshopTotal: 800,
  summaryLines: [{ label: "Cabinets", amount: 800 }],
};

describe("frozen snapshot detail lines", () => {
  it("keeps issued line detail through clamping", () => {
    const snapshot = clampQuoteSnapshot({
      ...base,
      detailLines: [{ kind: "note", label: "Living · Wall finish", amount: 600, detail: "10 m2 × 60" }],
    })!;
    expect(snapshot.detailLines).toEqual([
      { kind: "note", label: "Living · Wall finish", amount: 600, detail: "10 m2 × 60" },
    ]);
  });

  it("omits the field entirely when a snapshot has no lines", () => {
    expect(clampQuoteSnapshot({ ...base })!.detailLines).toBeUndefined();
    expect(clampQuoteSnapshot({ ...base, detailLines: [] })!.detailLines).toBeUndefined();
  });

  it("repairs missing fields and rounds amounts rather than dropping the line", () => {
    const snapshot = clampQuoteSnapshot({ ...base, detailLines: [{ amount: 12.6 } as never] })!;
    expect(snapshot.detailLines).toEqual([{ kind: "line", label: "Line", amount: 13 }]);
  });

  it("caps the number of retained lines", () => {
    const many = Array.from({ length: QUOTE_SNAPSHOT_DETAIL_LIMIT + 25 }, (_, index) => ({
      kind: "cabinet", label: `Line ${index}`, amount: index,
    }));
    expect(clampQuoteSnapshot({ ...base, detailLines: many })!.detailLines)
      .toHaveLength(QUOTE_SNAPSHOT_DETAIL_LIMIT);
  });

  it("exports issued lines on the frozen CSV", () => {
    const snapshot = clampQuoteSnapshot({
      ...base,
      detailLines: [{ kind: "note", label: "Living · Wall finish", amount: 600, detail: "10 m2 × 60" }],
    })!;
    const csv = csvFromFrozenSnapshot(snapshot);
    expect(csv).toContain("Issued line");
    expect(csv).toContain("Living · Wall finish");
    expect(csv).toContain("10 m2 × 60");
  });

  it("says so on the sheet when an older snapshot has no line detail", () => {
    const csv = csvFromFrozenSnapshot(clampQuoteSnapshot({ ...base })!);
    expect(csv).toContain("Not captured on this revision");
  });
});
