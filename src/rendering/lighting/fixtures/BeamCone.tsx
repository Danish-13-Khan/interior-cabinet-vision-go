import { DoubleSide } from "three";
import { beamConeDimensions } from "../../../domain/livingRoom/lightShade";
import { EXCLUDE_FROM_EXPORT } from "../../sceneExport/sceneExportFilter";

const passThroughRaycast = () => null;

/**
 * Translucent cone along local −Z from the emitter, shown while a spot fixture
 * is selected so a beam angle edit reads without a render. Editor only: no
 * light, no shadows, no picking, left out of exports.
 */
export function BeamCone(props: { color: string; halfAngleRad: number; rangeM: number; z?: number }) {
  const { lengthM, radiusM } = beamConeDimensions(props.halfAngleRad, props.rangeM);
  return (
    <mesh position={[0, 0, (props.z ?? 0) - lengthM / 2]} rotation={[Math.PI / 2, 0, 0]} raycast={passThroughRaycast}
      userData={{ [EXCLUDE_FROM_EXPORT]: true, beamCone: true }} renderOrder={2}>
      <coneGeometry args={[radiusM, lengthM, 24, 1, true]} />
      <meshBasicMaterial color={props.color} transparent opacity={0.14} depthWrite={false} side={DoubleSide} />
    </mesh>
  );
}
