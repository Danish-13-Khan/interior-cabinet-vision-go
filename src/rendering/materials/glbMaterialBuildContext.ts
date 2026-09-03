import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode, RenderModeQuality } from "../../domain/livingRoom/renderAssetContracts";
import { resolveModelViewMaterialBuildContext } from "../../domain/livingRoom/modelViewPreviewDefaults";
import { anisotropyForRenderMode } from "./materialScale";

export type GlbMaterialBuildContext = {
  quality?: RenderQuality;
  modeQuality?: RenderModeQuality;
  modelViewPreview: boolean;
  anisotropy: number;
};

export function resolveGlbMaterialBuildContext(args: {
  renderQuality?: RenderQuality;
  modelViewQuality?: RenderQuality | null;
  mode: RenderMode;
}): GlbMaterialBuildContext {
  const build = resolveModelViewMaterialBuildContext(args.modelViewQuality, args.renderQuality);
  return {
    ...build,
    anisotropy: anisotropyForRenderMode(args.mode, build.quality, build.modeQuality),
  };
}
