import { describe, expect, it } from "vitest";
import { resolveViewCubeAction } from "./viewCubeActions";

describe("resolveViewCubeAction", () => {
  it("maps home to iso + fit", () => {
    expect(resolveViewCubeAction("home")).toEqual({ preset: "iso", fit: true });
  });

  it("maps orthographic faces to matching presets + fit", () => {
    expect(resolveViewCubeAction("front")).toEqual({ preset: "front", fit: true });
    expect(resolveViewCubeAction("side")).toEqual({ preset: "side", fit: true });
    expect(resolveViewCubeAction("top")).toEqual({ preset: "top", fit: true });
  });

  it("maps reset to fit only (keep preset)", () => {
    expect(resolveViewCubeAction("reset")).toEqual({ preset: null, fit: true });
  });
});
