import type { RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { resolveEnvironmentDrawState } from "../assets/assetRegistry";
import { EnvironmentLighting } from "./EnvironmentLighting";
import { SceneProjectLights } from "./SceneProjectLights";

type RenderLightingRigProps = {
  scene: CompiledLivingRoomScene;
  recipeId: string;
  renderMode: RenderMode;
  renderQuality: RenderQuality;
  lightingQuality: EnvironmentLightingQuality;
};

/**
 * Combines editable project lights with HDRI/Lightformer environment lighting.
 * Does not mutate InteriorProject JSON.
 */
export function RenderLightingRig({
  scene,
  recipeId,
  renderQuality,
  lightingQuality,
}: RenderLightingRigProps) {
  const environment = resolveEnvironmentDrawState(recipeId);
  const envEnabled = renderQuality !== "draft";

  return (
    <>
      <EnvironmentLighting
        recipeId={recipeId}
        quality={lightingQuality}
        definition={environment.definition}
        url={environment.url}
        enabled={envEnabled}
      />
      <SceneProjectLights
        scene={scene}
        shadowMapSize={lightingQuality.shadowMapSize}
        shadowRadius={lightingQuality.shadowRadius}
      />
    </>
  );
}
