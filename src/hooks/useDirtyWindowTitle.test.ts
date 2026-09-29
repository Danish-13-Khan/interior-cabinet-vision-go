import { describe, expect, it } from "vitest";
import { dirtyWindowTitle } from "./useDirtyWindowTitle";

describe("dirty window title", () => {
  it("adds a bullet only while the project is unsaved", () => {
    expect(dirtyWindowTitle(false, "Living room")).toBe("Living room");
    expect(dirtyWindowTitle(true, "Living room")).toBe("Living room •");
  });
});
