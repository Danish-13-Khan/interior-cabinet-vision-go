import { describe, expect, it } from "vitest";
import {
  formatCameraDebugNumber,
  parseCameraDebugFlag,
  resolveCameraDebugEnabled,
} from "./cameraDebug";

describe("cameraDebug", () => {
  it("parses common on/off strings", () => {
    expect(parseCameraDebugFlag("1")).toBe(true);
    expect(parseCameraDebugFlag("true")).toBe(true);
    expect(parseCameraDebugFlag("on")).toBe(true);
    expect(parseCameraDebugFlag("0")).toBe(false);
    expect(parseCameraDebugFlag("false")).toBe(false);
    expect(parseCameraDebugFlag(null)).toBe(false);
  });

  it("prefers query param over storage", () => {
    expect(
      resolveCameraDebugEnabled({ search: "?cameraDebug=1", storageValue: "0" }),
    ).toBe(true);
    expect(
      resolveCameraDebugEnabled({ search: "?cameraDebug=0", storageValue: "1" }),
    ).toBe(false);
    expect(
      resolveCameraDebugEnabled({ search: "?foo=1", storageValue: "1" }),
    ).toBe(true);
    expect(
      resolveCameraDebugEnabled({ search: "?cameraDebug", storageValue: null }),
    ).toBe(true);
  });

  it("formats numbers safely", () => {
    expect(formatCameraDebugNumber(1.2345, 2)).toBe("1.23");
    expect(formatCameraDebugNumber(null)).toBe("—");
  });
});
