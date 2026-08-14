import { describe, expect, it } from "vitest";
import { resolveEnvironmentLightingQuality } from "./environmentLightingQuality";
import { resolveGroundingQuality } from "./groundingQuality";
import { describePresetHonesty } from "./presetHonesty";

describe("groundingQuality + preset honesty", () => {
  it("makes Client Preview contact shadows stronger than Draft", () => {
    const draft = resolveGroundingQuality("preview", "draft");
    const client = resolveGroundingQuality("hero", "client-preview");
    expect(client.opacityScale).toBeGreaterThan(draft.opacityScale);
    expect(client.resolution).toBeGreaterThan(draft.resolution);
    expect(client.farMeters).toBeGreaterThan(draft.farMeters);
  });

  it("keeps Draft preview lighter than Standard preview", () => {
    const draft = resolveEnvironmentLightingQuality("preview", "draft");
    const standard = resolveEnvironmentLightingQuality("preview", "standard");
    expect(standard.contactShadowResolution).toBeGreaterThanOrEqual(
      draft.contactShadowResolution,
    );
    expect(standard.contactShadowOpacityScale).toBeGreaterThan(
      draft.contactShadowOpacityScale,
    );
    expect(draft.preferHdri).toBe(false);
    expect(standard.preferHdri).toBe(true);
  });

  it("labels Draft as working and Client Preview as client delivery", () => {
    const draft = describePresetHonesty("draft", "preview");
    const client = describePresetHonesty("client-preview", "hero");
    expect(draft.role).toBe("working");
    expect(draft.headline).toMatch(/Draft/i);
    expect(client.role).toBe("client");
    expect(client.shortBadge).toContain("CLIENT PREVIEW");
    expect(client.shortBadge).toContain("HERO");
  });
});
