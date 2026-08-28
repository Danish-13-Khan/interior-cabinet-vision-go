import { useMemo } from "react";
import type { RenderQuality } from "../../domain/interiorProject";
import {
  computeArchitectureBounds,
  type CompiledLivingRoomScene,
} from "../../domain/livingRoom";
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
  projectLightScale?: number;
  windowKeyScale?: number;
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
  projectLightScale = 1,
  windowKeyScale = 1,
}: RenderLightingRigProps) {
  const environment = resolveEnvironmentDrawState(recipeId);
  const roomCenter = computeArchitectureBounds(scene.nodes).center;
  const windowKeys = useMemo(
    () => resolveWindowKeyLights({
      openings: scene.windowOpenings,
      roomCenterMm: roomCenter,
      recipeId,
      mode: renderMode,
      quality: renderQuality,
    }),
    [
      recipeId,
      renderMode,
      renderQuality,
      roomCenter.x,
      roomCenter.y,
      roomCenter.z,
      scene.windowOpenings,
    ],
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
        intensityScale={projectLightScale}
      />
      <WindowKeyLight
        lights={windowKeys}
        shadowMapSize={lightingQuality.shadowMapSize}
        shadowRadius={lightingQuality.shadowRadius}
        intensityScale={windowKeyScale}
      />
    </>
  );
}
