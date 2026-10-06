import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import type { ShadowCameraTuning } from "../../domain/livingRoom/shadowCameraTuning";
import { STUDIO_PROJECT_SHADOW } from "../../domain/livingRoom/shadowCameraTuning";
import {
  shouldProjectDirectionalCast,
  shouldProjectFillCastShadow,
} from "../../domain/livingRoom/directionalCasterBudget";
import { LIGHT_RENDER_SCALE } from "../../domain/livingRoom/lightFixtureTypes";
import { projectLightIsMounted } from "../../domain/livingRoom/fixtureLightBudget";
import { isRoomLightFixture } from "../../domain/livingRoom/roomLightFixtures";
import { RoomLightFixture } from "./RoomLightFixture";
import { ensureRectAreaLightSupport } from "./rectAreaLightSupport";
import { DirectionalProjectLight } from "./DirectionalProjectLight";

function degrees(value: number) {
  return value * Math.PI / 180;
}

/** Editable InteriorProject lights — kept compatible with existing light entities. */
export function SceneProjectLights({
  scene,
  shadowMapSize,
  shadowRadius,
  intensityScale = 1,
  roomLightScale = 1,
  shadowCamera,
  maxDirectionalCasters,
  selectedLightId = null,
  onSelectLight,
  onMoveLight,
  onLightDragState,
}: {
  scene: CompiledLivingRoomScene;
  shadowMapSize: number;
  shadowRadius: number;
  intensityScale?: number;
  /** Lighting mood: scales recipe lights only. Placed fixtures keep their own output. */
  roomLightScale?: number;
  /** Policy A override; Studio omits → STUDIO_PROJECT_SHADOW. */
  shadowCamera?: ShadowCameraTuning;
  /** Phase C Model View budget; Studio omits → unlimited project flags. */
  maxDirectionalCasters?: number;
  /** Phase 2 plumbs selection. Callers omit both until a light can be picked. */
  selectedLightId?: string | null;
  onSelectLight?: (id: string) => void;
  onMoveLight?: (id: string, point: { x: number; y: number; z: number }) => void;
  onLightDragState?: (dragging: boolean) => void;
}) {
  ensureRectAreaLightSupport();
  const recipeScale = intensityScale * roomLightScale;
  const cam = shadowCamera ?? STUDIO_PROJECT_SHADOW;
  const half = cam.frustumHalfExtent ?? 7;
  const fillCast = shouldProjectFillCastShadow(maxDirectionalCasters);
  let directionalCasterCount = 0;
  return (
    <>
      {scene.lights.filter((light) => projectLightIsMounted(light)).map((light) => {
        if (isRoomLightFixture(light)) {
          return (
            <RoomLightFixture
              key={light.id}
              light={light}
              intensityScale={intensityScale}
              castShadow={fillCast}
              emitsLight={light.parameters.emissiveOnly !== true}
              selected={selectedLightId === light.id}
              onSelect={onSelectLight}
              onMove={onMoveLight}
              onDragState={onLightDragState}
            />
          );
        }
        const position: [number, number, number] = [
          light.position.x / 1000,
          light.position.y / 1000,
          light.position.z / 1000,
        ];
        if (light.kind === "ambient") {
          return <ambientLight key={light.id} color={light.color} intensity={light.intensity * LIGHT_RENDER_SCALE.recipeAmbientScale * recipeScale} />;
        }
        if (light.kind === "directional") {
          const castShadow = shouldProjectDirectionalCast(
            light.parameters.castShadow === true,
            directionalCasterCount,
            maxDirectionalCasters,
          );
          if (castShadow) directionalCasterCount += 1;
          return (
            <DirectionalProjectLight
              key={light.id}
              light={light}
              position={position}
              intensity={light.intensity * LIGHT_RENDER_SCALE.recipeDirectionalScale * recipeScale}
              castShadow={castShadow}
              shadowMapSize={shadowMapSize}
              shadowRadius={shadowRadius}
              cam={cam}
              half={half}
            />
          );
        }
        if (light.kind === "point") {
          return (
            <pointLight
              key={light.id}
              position={position}
              color={light.color}
              intensity={light.intensity * recipeScale}
              distance={Number(light.parameters.rangeMm ?? 5000) / 1000}
              castShadow={fillCast}
              shadow-radius={shadowRadius}
            />
          );
        }
        if (light.kind === "spot") {
          return (
            <spotLight
              key={light.id}
              position={position}
              color={light.color}
              intensity={light.intensity * recipeScale}
              angle={Math.PI / 4}
              penumbra={0.5}
              castShadow={fillCast}
              shadow-radius={shadowRadius}
            />
          );
        }
        return (
          <rectAreaLight
            key={light.id}
            position={position}
            rotation={[degrees(light.rotation.x), degrees(light.rotation.y), degrees(light.rotation.z)]}
            color={light.color}
            intensity={light.intensity * recipeScale}
            width={Number(light.parameters.widthMm ?? 1200) / 1000}
            height={Number(light.parameters.heightMm ?? 900) / 1000}
          />
        );
      })}
    </>
  );
}
