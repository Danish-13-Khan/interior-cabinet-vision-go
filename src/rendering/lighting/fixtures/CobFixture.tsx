import { useMemo } from "react";
import { Object3D } from "three";
import { cobShadeParts, penumbraForDiffusion, readCobShade } from "../../../domain/livingRoom/lightShade";
import { BeamCone } from "./BeamCone";
import { FixtureEmitter } from "./FixtureEmitter";
import { beamHalfAngleRad, readFixtureSize } from "./fixtureMeasures";
import { FixtureGroup } from "./FixtureGroup";
import type { FixtureViewProps } from "./fixtureView";

/**
 * Recessed spot for COB and the ceiling downlight, in one of five shades
 * (roadmap §4.3). Parts come from `cobShadeParts` so the Cycles bundle builds
 * the same body. The can sits on +Z (into the ceiling once X = −90); the spot
 * sits on −Z and aims further along −Z; a gimbal tilts the cup, disc and spot.
 */
export function CobFixture(props: FixtureViewProps) {
  const size = readFixtureSize(props.light, props.intensityScale, props.castShadow);
  const spec = readCobShade(props.light);
  const radius = Math.max(size.length, size.across) / 2;
  const glow = props.light.enabled ? props.light.color : size.body;
  const parts = cobShadeParts(spec, radius, size.depth, glow);
  const target = useMemo(() => {
    const object = new Object3D();
    object.position.set(0, 0, -1);
    return object;
  }, []);
  const emitterZ = spec.shade === "surface" ? -(size.depth * 2 + 0.012) : -0.012;
  const span: [number, number, number] = [radius * 2, radius * 2, spec.shade === "surface" ? size.depth * 2 : size.depth];
  const tilt = spec.shade === "gimbal" ? spec.aimAngleDeg * Math.PI / 180 : 0;
  const spin = spec.shade === "gimbal" ? spec.aimRotationDeg * Math.PI / 180 : 0;
  const mesh = (part: typeof parts[number]) => (
    <mesh key={part.id} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, part.z]}>
      <cylinderGeometry args={[part.radiusTop, part.radiusBottom, part.height, 28]} />
      {part.glow
        ? <meshStandardMaterial color={part.color} emissive={part.color} emissiveIntensity={size.glow} roughness={part.roughness} />
        : <meshStandardMaterial color={part.color} metalness={part.metalness} roughness={part.roughness} />}
    </mesh>
  );
  return (
    <FixtureGroup {...props} span={span}>
      {parts.filter((part) => !part.tilted).map(mesh)}
      <group rotation={[0, 0, spin]}>
        <group rotation={[tilt, 0, 0]}>
          {parts.filter((part) => part.tilted).map(mesh)}
          <primitive object={target} />
          <FixtureEmitter on={props.emitsLight !== false}>
            <spotLight
              position={[0, 0, emitterZ]}
              target={target}
              color={props.light.color}
              intensity={size.intensity}
              distance={size.range}
              angle={beamHalfAngleRad(props.light)}
              penumbra={penumbraForDiffusion(spec.lensDiffusion)}
              castShadow={size.cast}
            />
          </FixtureEmitter>
          {props.selected ? <BeamCone color={props.light.color} halfAngleRad={beamHalfAngleRad(props.light)} rangeM={size.range} z={emitterZ} /> : null}
        </group>
      </group>
    </FixtureGroup>
  );
}
