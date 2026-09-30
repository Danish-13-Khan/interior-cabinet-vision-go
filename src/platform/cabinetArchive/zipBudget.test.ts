import { describe, expect, it } from "vitest";
import { assertArchiveBudget, MAX_ZIP_ENTRIES, MAX_ZIP_UNCOMPRESSED_BYTES } from "./zipBudget";

describe("cabinet zip budget", () => {
  it("rejects too many entries or too many uncompressed bytes", () => {
    expect(() => assertArchiveBudget(1, 10)).not.toThrow();
    expect(() => assertArchiveBudget(MAX_ZIP_ENTRIES + 1, 0)).toThrow(/too large/);
    expect(() => assertArchiveBudget(1, MAX_ZIP_UNCOMPRESSED_BYTES + 1)).toThrow(/too large/);
  });
});
