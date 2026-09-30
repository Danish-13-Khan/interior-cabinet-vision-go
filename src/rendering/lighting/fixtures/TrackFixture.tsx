import { useMemo } from "react";
import { Object3D } from "three";
import { fixtureNumber } from "../../../domain/livingRoom/lightFixtureProperties";
import { beamHalfAngleRad, clampedHeadCount, readFixtureSize } from "./fixtureMeasures";
import { FixtureGroup } from "./FixtureGroup";
import type { FixtureViewProps } from "./fixtureView";

/** Rail on X. Each head is its own spot, tilted about local X by aimAngleDeg, emitting −Z. */
export function TrackFixture(props: FixtureViewProps) {
  const size = readFixtureSize(props.light, props.intensityScale, props.castShadow);
  const heads = clampedHeadCount(props.light);
  const aim = fixtureNumber(props.light, "aimAngleDeg", 20) * Math.PI / 180;
  const angle = beamHalfAngleRad(props.light);
  const targets = useMemo(() => Array.from({ length: heads }, () => {
    const object = new Object3D();
    object.position.set(0, 0, -1);
    return object;
  }), [heads]);
  const xs = headOffsets(heads, size.length, size.across);
  const glow = props.light.enabled ? props.light.color : size.body;
  return (
    <FixtureGroup {...props} span={[size.length, size.across, size.depth]}>
      <mesh>
        <boxGeometry args={[size.length, size.across * 0.45, size.depth * 0.4]} />
        <meshStandardMaterial color={size.body} metalness={size.metal} roughness={0.36} />
      </mesh>
      {targets.map((target, index) => (
        <group key={target.uuid} position={[xs[index] ?? 0, 0, -(size.depth * 0.28)]} rotation={[aim, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -size.depth * 0.35]}>
            <cylinderGeometry args={[size.across * 0.28, size.across * 0.36, size.depth * 0.7, 16]} />
            <meshStandardMaterial color={size.body} emissive={glow} emissiveIntensity={size.glow} metalness={size.metal} roughness={0.4} />
          </mesh>
          <primitive object={target} />
          <spotLight
            position={[0, 0, -size.depth * 0.55]}
            target={target}
            color={props.light.color}
            intensity={size.intensity}
            distance={size.range}
            angle={angle}
            penumbra={0.55}
            castShadow={size.cast}
          />
        </group>
      ))}
    </FixtureGroup>
  );
}

function headOffsets(count: number, length: number, across: number) {
  if (count <= 1) return [0];
  const inset = Math.min(across, length / 2);
  const usable = Math.max(0, length - inset * 2);
  const step = usable / (count - 1);
  const origin = -usable / 2;
  return Array.from({ length: count }, (_, index) => origin + step * index);
}
