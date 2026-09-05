import { describe, expect, it } from "vitest";
import { guardFloorplanImage, MAX_FLOORPLAN_BYTES } from "./imageGuards";

function fakeFile(type: string, size: number, name = "plan.bin"): File {
  const buf = new Uint8Array(Math.min(size, 16));
  const file = new File([buf], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("guardFloorplanImage", () => {
  it("accepts png jpeg webp", () => {
    expect(guardFloorplanImage(fakeFile("image/png", 100)).ok).toBe(true);
    expect(guardFloorplanImage(fakeFile("image/jpeg", 100)).ok).toBe(true);
    expect(guardFloorplanImage(fakeFile("image/webp", 100)).ok).toBe(true);
  });

  it("rejects bad type and oversized files", () => {
    expect(guardFloorplanImage(fakeFile("image/gif", 100)).ok).toBe(false);
    expect(guardFloorplanImage(fakeFile("image/png", MAX_FLOORPLAN_BYTES + 1)).ok).toBe(false);
  });
});
