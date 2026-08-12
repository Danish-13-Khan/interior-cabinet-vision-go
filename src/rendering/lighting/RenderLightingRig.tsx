import { useMemo } from "react";
import type { RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { resolveWindowKeyLights } from "../../domain/livingRoom/windowKeyLight";
import { resolveEnvironmentDrawState } from "../assets/assetRegistry";
import { EnvironmentLighting } from "./EnvironmentLighting";
import { SceneProjectLights } from "./SceneProjectLights";
import { WindowKeyLight } from "./WindowKeyLight";

type RenderLightingRigProps = {
  scene: CompiledLivingRoomScene;
  recipeId: string;
  renderMode: RenderMode;
  renderQuality: RenderQuality;
  lightingQuality: EnvironmentLightingQuality;
};

/**
 * Combines editable project lights, HDRI/Lightformer env, and window key lights.
 * Does not mutate InteriorProject JSON.
 */
export function RenderLightingRig({
  scene,
  recipeId,
  renderMode,
  renderQuality,
  lightingQuality,
}: RenderLightingRigProps) {
  const environment = resolveEnvironmentDrawState(recipeId);
  const windowKeys = useMemo(
    () => resolveWindowKeyLights({
      openings: scene.windowOpenings,
      roomCenterMm: scene.bounds.center,
      recipeId,
      mode: renderMode,
      quality: renderQuality,
    }),
    [scene.windowOpenings, scene.bounds.center, recipeId, renderMode, renderQuality],
  );

  return (
    <>
      <EnvironmentLighting
        recipeId={recipeId}
        quality={lightingQuality}
        definition={environment.definition}
        url={environment.url}
        enabled={lightingQuality.preferHdri}
      />
      <SceneProjectLights
        scene={scene}
        shadowMapSize={lightingQuality.shadowMapSize}
        shadowRadius={lightingQuality.shadowRadius}
      />
      <WindowKeyLight
        lights={windowKeys}
        shadowMapSize={lightingQuality.shadowMapSize}
        shadowRadius={lightingQuality.shadowRadius}
      />
    </>
  );
}
