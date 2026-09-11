import { describe, expect, it } from "vitest";
import { resolveStudioRenderMode } from "./renderPresets";
import { resolveGlbCastShadow } from "./glbCastShadow";

describe("resolveGlbCastShadow", () => {
  it("casts in Model View Standard preview, not Draft", () => {
    expect(
      resolveGlbCastShadow({
        renderMode: "preview",
        modelViewPreview: true,
        modelViewQuality: "draft",
      }),
    ).toBe(false);
    expect(
      resolveGlbCastShadow({
        renderMode: "preview",
        modelViewPreview: true,
        modelViewQuality: "standard",
      }),
    ).toBe(true);
  });

  it("does not cast for Studio Draft preview", () => {
    expect(
      resolveGlbCastShadow({
        renderMode: resolveStudioRenderMode("draft"),
        modelViewPreview: false,
        modelViewQuality: null,
      }),
    ).toBe(false);
  });

  it("preserves cast for every Studio hero tier", () => {
    for (const quality of ["standard", "presentation", "client-preview"] as const) {
      expect(
        resolveGlbCastShadow({
          renderMode: resolveStudioRenderMode(quality),
          modelViewPreview: false,
          modelViewQuality: null,
        }),
      ).toBe(true);
    }
  });

  it("keeps hero cast even when Model View draft quality is present", () => {
    expect(
      resolveGlbCastShadow({
        renderMode: "hero",
        modelViewPreview: true,
        modelViewQuality: "draft",
      }),
    ).toBe(true);
  });

  it("ignores standard quality when not in Model View preview", () => {
    expect(
      resolveGlbCastShadow({
        renderMode: resolveStudioRenderMode("draft"),
        modelViewPreview: false,
        modelViewQuality: "standard",
      }),
    ).toBe(false);
  });
});
