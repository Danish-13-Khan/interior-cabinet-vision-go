import { describe, expect, it } from "vitest";
import { resolveStudioRenderMode } from "./renderPresets";
import { assignGlbCasterSlots, resolveGlbCastShadow } from "./glbCastShadow";

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
        glbCasterSlot: 0,
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

  it("caps Model View Standard GLB casters by slot budget", () => {
    expect(
      resolveGlbCastShadow({
        renderMode: "preview",
        modelViewPreview: true,
        modelViewQuality: "standard",
        glbCasterSlot: 9,
        maxGlbCasters: 10,
      }),
    ).toBe(true);
    expect(
      resolveGlbCastShadow({
        renderMode: "preview",
        modelViewPreview: true,
        modelViewQuality: "standard",
        glbCasterSlot: 10,
        maxGlbCasters: 10,
      }),
    ).toBe(false);
  });

  it("assigns GLB caster slots in node order", () => {
    const slots = assignGlbCasterSlots([
      { id: "a", renderBinding: { strategy: "procedural" } },
      { id: "b", renderBinding: { strategy: "glb" } },
      { id: "c", renderBinding: { strategy: "glb" } },
    ]);
    expect(slots.get("b")).toBe(0);
    expect(slots.get("c")).toBe(1);
    expect(slots.has("a")).toBe(false);
  });
});
