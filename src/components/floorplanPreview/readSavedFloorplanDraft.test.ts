import { describe, expect, it } from "vitest";
import { readSavedFloorplanDraft } from "./readSavedFloorplanDraft";
import { glbDraftA } from "../../domain/floorplanExtract/glbExport.testHelpers";

describe("readSavedFloorplanDraft", () => {
  it("returns a shaped draft for valid extract JSON", () => {
    expect(readSavedFloorplanDraft(glbDraftA)?.schema_version).toBe("1.0");
  });

  it("returns null for corrupt payloads", () => {
    expect(readSavedFloorplanDraft(null)).toBeNull();
    expect(readSavedFloorplanDraft({ nope: true })).toBeNull();
    expect(readSavedFloorplanDraft("x")).toBeNull();
  });
});
