import { FixtureEmitter } from "./FixtureEmitter";
import { readFixtureSize } from "./fixtureMeasures";
import { FixtureGroup } from "./FixtureGroup";
import type { FixtureViewProps } from "./fixtureView";

/**
 * Shade opening faces local −Z (down after ceiling X = −90). The point light
 * has no beam axis; it sits in that opening. The stem runs toward +Z, up to the canopy.
 */
export function PendantFixture(props: FixtureViewProps) {
  const size = readFixtureSize(props.light, props.intensityScale, props.castShadow);
  const radius = Math.max(size.length, size.across) / 2;
  const glow = props.light.enabled ? props.light.color : size.body;
  return (
    <FixtureGroup {...props} span={[radius * 2, radius * 2, size.depth]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, size.depth / 2]}>
        <cylinderGeometry args={[Math.min(0.008, radius * 0.12), Math.min(0.008, radius * 0.12), size.depth, 8]} />
        <meshStandardMaterial color={size.body} metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[radius, size.depth, 24]} />
        <meshStandardMaterial color={size.body} emissive={glow} emissiveIntensity={size.glow} roughness={0.42} />
      </mesh>
      <FixtureEmitter on={props.emitsLight !== false}>
        <pointLight
          position={[0, 0, -size.depth * 0.35]}
          color={props.light.color}
          intensity={size.intensity}
          distance={size.range}
          castShadow={size.cast}
        />
      </FixtureEmitter>
    </FixtureGroup>
  );
}
