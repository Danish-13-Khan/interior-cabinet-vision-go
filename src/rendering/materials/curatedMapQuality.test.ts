import { describe, expect, it } from "vitest";
import { getRenderModeQuality } from "../../domain/livingRoom/heroRenderQuality";
import { resolveModelViewMaterialQuality } from "../../domain/livingRoom/modelViewPreviewDefaults";
import {
  resolveCuratedBumpMap,
  resolveCuratedMapAnisotropy,
} from "./curatedMapQuality";

describe("curatedMapQuality path separation", () => {
  it("uses Model View anisotropy overrides, not generic preview ladder", () => {
    const mv = resolveModelViewMaterialQuality("standard");
    const generic = getRenderModeQuality("preview", "standard");
    expect(resolveCuratedMapAnisotropy("preview", "standard", mv)).toBe(10);
    expect(resolveCuratedMapAnisotropy("preview", "standard")).toBe(generic.anisotropy);
    expect(generic.anisotropy).toBe(8);
  });

  it("keeps Studio hero ladder when modeQuality is omitted", () => {
    const hero = getRenderModeQuality("hero", "standard");
    expect(resolveCuratedMapAnisotropy("hero", "standard")).toBe(hero.anisotropy);
  });

  it("keeps procedural bump when curated color exists without a normal map", () => {
    expect(resolveCuratedBumpMap(undefined, "bump")).toBe("bump");
    expect(resolveCuratedBumpMap("normal", "bump")).toBeUndefined();
  });
});
