import { describe, expect, it } from "vitest";
import { resolveModelViewMaterialQuality } from "../../domain/livingRoom/modelViewPreviewDefaults";
import { resolveGlbMaterialBuildContext } from "./applyGlbSlotMaterials";
import { resolveImportedGlbMaterialResponse } from "./importedGlbMaterialTuning";

describe("importedGlbMaterialTuning", () => {
  it("applies preview modeQuality to imported GLB response", () => {
    const draft = resolveGlbMaterialBuildContext({
      renderQuality: "draft",
      modelViewQuality: "draft",
      mode: "preview",
    });
    const standard = resolveGlbMaterialBuildContext({
      renderQuality: "standard",
      modelViewQuality: "standard",
      mode: "preview",
    });
    const draftResponse = resolveImportedGlbMaterialResponse("preview", draft);
    const standardResponse = resolveImportedGlbMaterialResponse("preview", standard);

    expect(draftResponse.roughness).not.toBe(0.62);
    expect(standardResponse.roughness).not.toBe(0.62);
    expect(standardResponse.roughness).not.toBe(draftResponse.roughness);
    expect(standardResponse.envMapIntensity).toBeGreaterThan(draftResponse.envMapIntensity);
    expect(standardResponse.specularIntensity).toBeGreaterThanOrEqual(draftResponse.specularIntensity);
    expect(draft.modeQuality).toEqual(resolveModelViewMaterialQuality("draft"));
    expect(standard.modeQuality).toEqual(resolveModelViewMaterialQuality("standard"));
  });
});
