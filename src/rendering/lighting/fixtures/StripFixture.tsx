import { readFixtureSize, STRIP_HALO_ROTATION, STRIP_HALO_STANDOFF_M, stripHaloIntensity } from "./fixtureMeasures";
import { FixtureGroup } from "./FixtureGroup";
import type { FixtureViewProps } from "./fixtureView";

/** Rope, profile and under-cabinet. The rect light is unrotated, so it emits local −Z. */
export function StripFixture(props: FixtureViewProps) {
  const size = readFixtureSize(props.light, props.intensityScale, props.castShadow);
  const vertical = props.light.parameters.fixtureKind === "profile" && props.light.parameters.orientation === "vertical";
  const rope = props.light.parameters.fixtureKind === "rope";
  const span: [number, number, number] = vertical
    ? [size.across, size.length, size.depth]
    : [size.length, size.across, size.depth];
  const front = rope ? Math.min(size.across, size.depth) / 2 : size.depth / 2;
  const glow = props.light.enabled ? props.light.color : size.body;
  const onWall = typeof props.light.parameters.hostWallId === "string" && props.light.parameters.hostWallId !== "";
  return (
    <FixtureGroup {...props} span={span}>
      {rope
        ? <RopeTube length={size.length} radius={front} body={size.body} />
        : (
          <mesh>
            <boxGeometry args={span} />
            <meshStandardMaterial color={size.body} metalness={size.metal} roughness={0.38} />
          </mesh>
        )}
      <mesh position={[0, 0, -(front + 0.001)]}>
        <boxGeometry args={[span[0] * 0.86, Math.max(span[1] * 0.62, 0.004), 0.003]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={size.glow} roughness={0.32} />
      </mesh>
      <rectAreaLight
        position={[0, 0, -(front + 0.006)]}
        color={props.light.color}
        intensity={size.intensity}
        width={span[0]}
        height={Math.max(span[1], 0.01)}
      />
      {onWall ? (
        <rectAreaLight
          position={[0, 0, -(front + STRIP_HALO_STANDOFF_M)]}
          rotation={STRIP_HALO_ROTATION}
          color={props.light.color}
          intensity={stripHaloIntensity(size.intensity)}
          width={span[0]}
          height={Math.max(span[1], 0.01)}
        />
      ) : null}
    </FixtureGroup>
  );
}

/** Cylinder length is Y; roll it onto X. That does not steer the −Z emitter. */
function RopeTube({ length, radius, body }: { length: number; radius: number; body: string }) {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[radius, radius, length, 20]} />
      <meshStandardMaterial color={body} roughness={0.45} />
    </mesh>
  );
}
