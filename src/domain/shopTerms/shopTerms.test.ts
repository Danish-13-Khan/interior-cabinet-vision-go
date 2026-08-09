import { describe, expect, it } from "vitest";
import {
  familyGlyph,
  familyShort,
  familyTerm,
  formatCabinetMark,
  formatFillerMark,
  formatOpeningMark,
  formatPartShopRef,
  formatRunMark,
  viewGlyph,
  viewSheetLabel,
  viewTabLabel,
} from "./index";

describe("shopTerms", () => {
  it("uses cabinet-industry marks and family names", () => {
    expect(formatCabinetMark(0)).toBe("C01");
    expect(formatRunMark(2)).toBe("R03");
    expect(formatFillerMark(0)).toBe("FL-1");
    expect(formatOpeningMark("door", 0)).toBe("OP-1");
    expect(formatOpeningMark("drawer-stack", 2)).toBe("DW-3");
    expect(formatPartShopRef(1, 4)).toBe("C01-P04");
    expect(familyTerm("sink")).toBe("Sink Base");
    expect(familyShort("drawer")).toBe("Drawer");
  });

  it("standardizes view labels and glyphs", () => {
    expect(viewTabLabel("3d")).toBe("Model");
    expect(viewTabLabel("front")).toBe("Elev.");
    expect(viewSheetLabel("report")).toBe("SCHEDULE");
    expect(viewGlyph("plan")).toBe("PL");
    expect(familyGlyph("base")).toBe("B");
  });
});
