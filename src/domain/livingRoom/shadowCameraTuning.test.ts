import { describe, expect, it } from "vitest";
import {
  STUDIO_PROJECT_SHADOW,
  STUDIO_WINDOW_KEY_SHADOW,
  resolveModelViewProjectShadow,
  resolveModelViewWindowKeyShadow,
} from "./shadowCameraTuning";

describe("shadowCameraTuning Policy A", () => {
  it("keeps Studio constants as the shared baseline", () => {
    expect(STUDIO_PROJECT_SHADOW.frustumHalfExtent).toBe(7);
    expect(STUDIO_PROJECT_SHADOW.bias).toBe(-0.00028);
    expect(STUDIO_WINDOW_KEY_SHADOW.radiusExtra).toBe(1);
  });

  it("gives Model View Standard distinct project shadow inputs from Studio", () => {
    const mv = resolveModelViewProjectShadow("standard");
    expect(mv.frustumHalfExtent).not.toBe(STUDIO_PROJECT_SHADOW.frustumHalfExtent);
    expect(mv.bias).not.toBe(STUDIO_PROJECT_SHADOW.bias);
    expect(mv.normalBias).not.toBe(STUDIO_PROJECT_SHADOW.normalBias);
    expect(mv.radiusExtra).toBeGreaterThan(STUDIO_PROJECT_SHADOW.radiusExtra);
  });

  it("gives Model View Standard distinct window-key shadow inputs from Studio", () => {
    const mv = resolveModelViewWindowKeyShadow("standard");
    expect(mv.bias).not.toBe(STUDIO_WINDOW_KEY_SHADOW.bias);
    expect(mv.normalBias).not.toBe(STUDIO_WINDOW_KEY_SHADOW.normalBias);
    expect(mv.far).toBeGreaterThan(STUDIO_WINDOW_KEY_SHADOW.far);
  });

  it("keeps Model View Draft closer to Studio project frustum", () => {
    const draft = resolveModelViewProjectShadow("draft");
    expect(draft.frustumHalfExtent).toBe(STUDIO_PROJECT_SHADOW.frustumHalfExtent);
  });
});
