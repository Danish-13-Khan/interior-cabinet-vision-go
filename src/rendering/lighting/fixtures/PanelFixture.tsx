import { readFixtureSize } from "./fixtureMeasures";
import { FixtureGroup } from "./FixtureGroup";
import type { FixtureViewProps } from "./fixtureView";

/** Thin panel in XY. Ceiling mount sets rotation X to −90, so −Z points down. */
export function PanelFixture(props: FixtureViewProps) {
  const size = readFixtureSize(props.light, props.intensityScale, props.castShadow);
  const span: [number, number, number] = [size.length, size.across, size.depth];
  const glow = props.light.enabled ? props.light.color : size.body;
  return (
    <FixtureGroup {...props} span={span}>
      <mesh>
        <boxGeometry args={span} />
        <meshStandardMaterial color={size.body} metalness={0.12} roughness={0.46} />
      </mesh>
      <mesh position={[0, 0, -(size.depth / 2 + 0.001)]}>
        <boxGeometry args={[size.length * 0.94, size.across * 0.94, 0.004]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={size.glow} roughness={0.3} />
      </mesh>
      <rectAreaLight
        position={[0, 0, -(size.depth / 2 + 0.008)]}
        color={props.light.color}
        intensity={size.intensity}
        width={size.length}
        height={size.across}
      />
    </FixtureGroup>
  );
}
