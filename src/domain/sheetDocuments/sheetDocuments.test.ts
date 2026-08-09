import { describe, expect, it } from "vitest";
import {
  addCombinedDocumentationSheet,
  clampProjectSheetSet,
  createDefaultProjectSheetSet,
  placeViewOnSheet,
  printableSheetSpecsFromSet,
  renameSheetDocument,
  resolveSheetChrome,
  setSheetDocumentNotes,
} from "./index";

describe("sheetDocuments", () => {
  it("seeds named drawings from the catalog with viewports", () => {
    const set = createDefaultProjectSheetSet("B");
    expect(set.sheets.length).toBe(6);
    expect(set.sheets[0]!.viewports[0]!.viewKind).toBe("top");
    expect(set.sheets[0]!.revisionRows[0]!.revision).toBe("B");
    expect(set.sheets.every((sheet) => sheet.viewports.length >= 1)).toBe(true);
  });

  it("renames sheets and stores sheet notes", () => {
    let set = createDefaultProjectSheetSet();
    set = renameSheetDocument(set, "plan", "Kitchen Plan Issue");
    set = setSheetDocumentNotes(set, "plan", ["Verify wall dimensions on site"]);
    const plan = set.sheets.find((sheet) => sheet.id === "plan")!;
    expect(plan.name).toBe("Kitchen Plan Issue");
    expect(plan.notes).toEqual(["Verify wall dimensions on site"]);
  });

  it("adds a combined plan/elevation documentation sheet", () => {
    let set = createDefaultProjectSheetSet();
    set = addCombinedDocumentationSheet(set);
    const combo = set.sheets.find((sheet) => sheet.group === "custom");
    expect(combo).toBeTruthy();
    expect(combo!.viewports).toHaveLength(2);
    expect(combo!.viewports.map((viewport) => viewport.viewKind)).toEqual([
      "top",
      "front",
    ]);
    expect(combo!.pageSize).toBe("A3");
  });

  it("clamps unknown sheets back to a usable set", () => {
    const set = clampProjectSheetSet({
      sheets: [{ id: "x", name: " X ", code: "Z-1", primaryView: "top" } as never],
      activeSheetId: "missing",
    });
    expect(set.sheets.length).toBeGreaterThanOrEqual(6);
    expect(set.sheets.some((sheet) => sheet.id === "plan" || sheet.catalogId === "plan")).toBe(
      true,
    );
  });

  it("resolves chrome and printable specs for documentation", () => {
    const set = createDefaultProjectSheetSet();
    const chrome = resolveSheetChrome("front");
    expect(chrome.code).toBe("A-201");
    expect(chrome.viewLabel).toContain("FRONT");
    const printable = printableSheetSpecsFromSet(set);
    expect(printable.map((page) => page.view)).toEqual([
      "top",
      "front",
      "side",
      "section",
      "detail",
      "report",
    ]);
  });

  it("places additional views onto a named sheet", () => {
    let set = createDefaultProjectSheetSet();
    set = placeViewOnSheet(set, "plan", "front");
    const plan = set.sheets.find((sheet) => sheet.id === "plan")!;
    expect(plan.viewports.map((viewport) => viewport.viewKind)).toEqual([
      "top",
      "front",
    ]);
    expect(plan.pageSize).toBe("A3");
  });
});
