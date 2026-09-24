import { describe, expect, it } from "vitest";
import { nextModelFieldOfView } from "./modelFieldOfView";

describe("model field of view", () => {
  it("zooms in and out inside the camera limits", () => {
    expect(nextModelFieldOfView(42, "in")).toBe(38);
    expect(nextModelFieldOfView(42, "out")).toBe(46);
    expect(nextModelFieldOfView(18, "in")).toBe(18);
    expect(nextModelFieldOfView(70, "out")).toBe(70);
  });
});
