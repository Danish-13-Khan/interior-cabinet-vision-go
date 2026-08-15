import { describe, expect, it } from "vitest";
import { parseMmDraft } from "./NumberField";

describe("parseMmDraft", () => {
  it("applies finite millimetre values while typing", () => {
    expect(parseMmDraft("2200")).toBe(2200);
    expect(parseMmDraft("2")).toBe(2);
  });

  it("ignores empty and incomplete drafts so the field can keep focus", () => {
    expect(parseMmDraft("")).toBeNull();
    expect(parseMmDraft("   ")).toBeNull();
    expect(parseMmDraft("-")).toBeNull();
  });
});
