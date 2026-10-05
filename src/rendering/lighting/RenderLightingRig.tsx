import { useMemo } from "react";
import type { RenderQuality } from "../../domain/interiorProject";
import {
  computeArchitectureBounds,
  type CompiledLivingRoomScene,
} from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import {
  resolveRoomFitFrustumHalfExtent,
  roomSpanMetersFromSizeMm,
} from "../../domain/livingRoom/roomFitShadowFrustum";
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
  /** Lighting mood. 1 is day; evening dims sky, sun, recipe and window light. */
  roomLightScale?: number;
  selectedLightId?: string | null;
  onSelectLight?: (id: string) => void;
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
  roomLightScale = 1,
  selectedLightId = null,
  onSelectLight,
}: RenderLightingRigProps) {
  const environment = resolveEnvironmentDrawState(recipeId);
  const architectureBounds = computeArchitectureBounds(scene.nodes);
  const roomCenter = architectureBounds.center;
  const projectShadow = useMemo(() => {
    if (!lightingQuality.projectShadow) return undefined;
    const span = roomSpanMetersFromSizeMm(architectureBounds.size);
    const base = lightingQuality.projectShadow.frustumHalfExtent ?? 7;
    return {
      ...lightingQuality.projectShadow,
      frustumHalfExtent: resolveRoomFitFrustumHalfExtent(span, base),
    };
  }, [
    architectureBounds.size.depthMm,
    architectureBounds.size.widthMm,
    lightingQuality.projectShadow,
  ]);
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

  const environmentQuality = roomLightScale === 1
    ? lightingQuality
    : { ...lightingQuality, intensityScale: lightingQuality.intensityScale * roomLightScale };

  return (
    <>
      <EnvironmentLighting
        recipeId={recipeId}
        quality={environmentQuality}
        definition={environment.definition}
        url={environment.url}
        enabled={lightingQuality.preferHdri}
      />
      <SceneProjectLights
        scene={scene}
        shadowMapSize={lightingQuality.shadowMapSize}
        shadowRadius={lightingQuality.shadowRadius}
        intensityScale={projectLightScale}
        roomLightScale={roomLightScale}
        shadowCamera={projectShadow}
        maxDirectionalCasters={lightingQuality.maxDirectionalCasters}
        selectedLightId={selectedLightId}
        onSelectLight={onSelectLight}
      />
      <WindowKeyLight
        lights={windowKeys}
        shadowMapSize={lightingQuality.shadowMapSize}
        shadowRadius={lightingQuality.shadowRadius}
        intensityScale={windowKeyScale * roomLightScale}
        shadowCamera={lightingQuality.windowKeyShadow}
      />
    </>
  );
}
