import { describe, expect, it } from "vitest";
import { MODEL_VIEW_CUTAWAY_DEFAULT } from "./modelViewCutawayDefault";

describe("3D review cutaway default", () => {
  it("starts with near-wall cutaway on so cabinets and furniture are visible", () => {
    expect(MODEL_VIEW_CUTAWAY_DEFAULT).toBe(true);
  });
});
