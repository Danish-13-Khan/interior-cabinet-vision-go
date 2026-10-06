import { describe, expect, it } from "vitest";
import {
  armNextCameraGlideMs,
  resetShowcaseCameraJumpForTests,
  takeShowcaseGlideMs,
} from "./showcaseJump";
import { OVERVIEW_CORNER_GLIDE_MS } from "../livingRoom/overviewCameras";

describe("armNextCameraGlideMs", () => {
  it("lengthens the next ease once, without the default 320 ms", () => {
    resetShowcaseCameraJumpForTests();
    armNextCameraGlideMs(OVERVIEW_CORNER_GLIDE_MS);
    expect(takeShowcaseGlideMs()).toBe(1000);
    expect(takeShowcaseGlideMs()).toBeNull();
  });
});
