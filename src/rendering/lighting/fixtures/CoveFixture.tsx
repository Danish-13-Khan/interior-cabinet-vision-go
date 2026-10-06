import { FixtureEmitter } from "./FixtureEmitter";
import { COVE_WALL_LIGHT_ROTATION, coveWallIntensity, readFixtureSize } from "./fixtureMeasures";
import { FixtureGroup } from "./FixtureGroup";
import type { FixtureViewProps } from "./fixtureView";

/**
 * Shelf in the canonical frame: length on X, protrusion on Y (wall is +Y),
 * board thickness on Z. The up-light has no local rotation, so it emits −Z.
 * The wall band is a second rect area whose own −Z is turned onto +Y.
 */
export function CoveFixture(props: FixtureViewProps) {
  const size = readFixtureSize(props.light, props.intensityScale, props.castShadow);
  const board = size.across;
  const emitZ = -(board / 2 + 0.006);
  return (
    <FixtureGroup {...props} span={[size.length, size.depth, board]}>
      <mesh>
        <boxGeometry args={[size.length, size.depth, board]} />
        <meshStandardMaterial color={size.body} metalness={0.25} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0, emitZ]}>
        <boxGeometry args={[size.length * 0.92, size.depth * 0.55, 0.004]} />
        <meshStandardMaterial color={props.light.color} emissive={props.light.color} emissiveIntensity={size.glow} roughness={0.35} />
      </mesh>
      <FixtureEmitter on={props.emitsLight !== false}>
        <rectAreaLight
          position={[0, 0, emitZ - 0.004]}
          color={props.light.color}
          intensity={size.intensity}
          width={size.length}
          height={size.depth}
        />
        <rectAreaLight
          position={[0, -size.depth * 0.2, emitZ]}
          rotation={COVE_WALL_LIGHT_ROTATION}
          color={props.light.color}
          intensity={coveWallIntensity(size.intensity)}
          width={size.length}
          height={size.depth}
        />
      </FixtureEmitter>
    </FixtureGroup>
  );
}
