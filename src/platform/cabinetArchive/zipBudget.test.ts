import { describe, expect, it } from "vitest";
import { assertArchiveBudget, assertPackBudget, MAX_ZIP_ENTRIES, MAX_ZIP_UNCOMPRESSED_BYTES } from "./zipBudget";

describe("cabinet zip budget", () => {
  it("rejects too many entries or too many uncompressed bytes", () => {
    expect(() => assertArchiveBudget(1, 10)).not.toThrow();
    expect(() => assertArchiveBudget(MAX_ZIP_ENTRIES + 1, 0)).toThrow(/too large/);
    expect(() => assertArchiveBudget(1, MAX_ZIP_UNCOMPRESSED_BYTES + 1)).toThrow(/too large/);
  });

  it("refuses to save what it could not open again", () => {
    expect(() => assertPackBudget(MAX_ZIP_ENTRIES, MAX_ZIP_UNCOMPRESSED_BYTES)).not.toThrow();
    expect(() => assertPackBudget(1, MAX_ZIP_UNCOMPRESSED_BYTES + 1)).toThrow(/too large to save/);
    expect(() => assertPackBudget(MAX_ZIP_ENTRIES + 1, 0)).toThrow(/too many files/);
  });
});
