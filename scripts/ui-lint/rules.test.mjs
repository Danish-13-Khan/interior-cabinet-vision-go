import { describe, expect, it } from "vitest";
import { checkFile, countHexColours, countImportant, findSmallFontSizes } from "./rules.mjs";

describe("findSmallFontSizes", () => {
  it("flags px, rem and pt sizes below 12px", () => {
    const css = ".a { font-size: 11px; }\n.b { font-size: 0.7rem; }\n.c { font-size: 8pt; }";
    expect(findSmallFontSizes(css).map((hit) => hit.value)).toEqual(["11px", "0.7rem", "8pt"]);
  });

  it("checks the size inside the font shorthand, not the line height", () => {
    expect(findSmallFontSizes(".a { font: 600 10px/1.2 var(--font-sans); }")).toHaveLength(1);
    expect(findSmallFontSizes(".a { font: 600 12px/10px var(--font-sans); }")).toHaveLength(0);
  });

  it("accepts tokens and sizes at or above the minimum", () => {
    expect(findSmallFontSizes(".a { font-size: var(--text-xs); } .b { font-size: 12px; } .c { font-size: 0.75rem; }")).toEqual([]);
  });

  it("ignores SVG drawing text, print blocks and comments", () => {
    const css = [
      ".label { fill: #000; font-size: 7px; }",
      "@media print { .sheet { font-size: 7pt; } }",
      "/* .x { font-size: 6px; } */",
    ].join("\n");
    expect(findSmallFontSizes(css)).toEqual([]);
  });

  it("reports the declaration line", () => {
    expect(findSmallFontSizes(".a {\n  color: red;\n  font-size: 9px;\n}")[0].line).toBe(3);
  });
});

describe("colour and !important counts", () => {
  it("counts hex colours in declarations only", () => {
    expect(countHexColours("#root { color: #fff; border: 1px solid #A0714B; }")).toBe(2);
    expect(countHexColours(".a { color: var(--ink); } /* #123456 */")).toBe(0);
  });

  it("counts !important outside comments", () => {
    expect(countImportant(".a { color: red !important; width: 1px ! important; } /* !important */")).toBe(2);
  });
});

describe("checkFile", () => {
  it("fails new hex colours and !important in a file without a baseline", () => {
    const result = checkFile({ path: "new.css", source: ".a { color: #fff !important; }" });
    expect(result.errors).toHaveLength(2);
  });

  it("passes at baseline and reports when the baseline can be tightened", () => {
    const source = ".a { color: #fff; }";
    expect(checkFile({ path: "old.css", source, baseline: [1, 0] })).toMatchObject({ errors: [], canTighten: false });
    expect(checkFile({ path: "old.css", source, baseline: [3, 1] })).toMatchObject({ errors: [], canTighten: true });
  });

  it("lets the token file define raw colours", () => {
    expect(checkFile({ path: "src/styles/tokens.css", source: ":root { --ink: #1f2421; }", allowHex: true }).errors).toEqual([]);
  });
});
