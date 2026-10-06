import { useMemo } from "react";
import { Object3D } from "three";
import { FixtureEmitter } from "./FixtureEmitter";
import { beamHalfAngleRad, readFixtureSize } from "./fixtureMeasures";
import { FixtureGroup } from "./FixtureGroup";
import type { FixtureViewProps } from "./fixtureView";

/**
 * Recessed spot for COB and the ceiling downlight. The can is shifted to +Z
 * (into the ceiling once X = −90). The spot itself sits on −Z and aims at a
 * target further along −Z; `angle` is half the authored beam.
 */
export function CobFixture(props: FixtureViewProps) {
  const size = readFixtureSize(props.light, props.intensityScale, props.castShadow);
  const radius = Math.max(size.length, size.across) / 2;
  const target = useMemo(() => {
    const object = new Object3D();
    object.position.set(0, 0, -1);
    return object;
  }, []);
  const glow = props.light.enabled ? props.light.color : size.body;
  return (
    <FixtureGroup {...props} span={[radius * 2, radius * 2, size.depth]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, size.depth / 2]}>
        <cylinderGeometry args={[radius, radius * 0.82, size.depth, 28]} />
        <meshStandardMaterial color={size.body} metalness={size.metal} roughness={0.34} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.001]}>
        <cylinderGeometry args={[radius * 0.72, radius * 0.72, 0.004, 28]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={size.glow} roughness={0.28} />
      </mesh>
      <primitive object={target} />
      <FixtureEmitter on={props.emitsLight !== false}>
        <spotLight
          position={[0, 0, -0.012]}
          target={target}
          color={props.light.color}
          intensity={size.intensity}
          distance={size.range}
          angle={beamHalfAngleRad(props.light)}
          penumbra={0.65}
          castShadow={size.cast}
        />
      </FixtureEmitter>
    </FixtureGroup>
  );
}
