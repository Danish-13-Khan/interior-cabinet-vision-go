import { describe, expect, it } from "vitest";
import { floorplanDraftContentKey, floorplanDraftHash } from "./floorplanDraftKey";
import { glbDraftA } from "../../domain/floorplanExtract/glbExport.testHelpers";

describe("floorplanDraftKey", () => {
  it("hashes content to a short stable key", () => {
    const a = floorplanDraftHash(glbDraftA);
    const b = floorplanDraftHash(glbDraftA);
    expect(a).toBe(b);
    expect(a.length).toBeLessThan(40);
    expect(floorplanDraftContentKey(glbDraftA, "t1", "p1")).toContain(a);
  });
});
