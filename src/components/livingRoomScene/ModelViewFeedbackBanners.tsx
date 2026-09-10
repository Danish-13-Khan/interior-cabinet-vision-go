import { MaterialTextureLoadBanner } from "./MaterialTextureLoadBanner";
import { ModelGlbFallbackBanner } from "./ModelGlbFallbackBanner";

/** Viewport notices for texture / GLB silent fallbacks (Steps 5–6). */
export function ModelViewFeedbackBanners() {
  return (
    <>
      <MaterialTextureLoadBanner />
      <ModelGlbFallbackBanner />
    </>
  );
}
