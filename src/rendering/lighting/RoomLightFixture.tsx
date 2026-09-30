import { useMemo } from "react";
import { Object3D } from "three";
import type { LightEntity } from "../../domain/interiorProject";
import { fixtureEmissiveIntensity, fixtureRenderIntensity } from "../../domain/livingRoom/lightFixtureTypes";

/** Degrees to a group Euler. YXZ tilts about X before yaw, so a side-wall cove still aims up. */
export function roomLightRotation(rotation: { x: number; y: number; z: number }): [number, number, number, "YXZ"] {
  const toRad = Math.PI / 180;
  return [rotation.x * toRad, rotation.y * toRad, rotation.z * toRad, "YXZ"];
}

/** Visible fixture and its illumination share a transform and saved light entity. */
export function RoomLightFixture({ light, intensityScale, castShadow }: {
  light: LightEntity;
  intensityScale: number;
  castShadow: boolean;
}) {
  const target = useMemo(() => {
    const object = new Object3D();
    object.position.set(0, 0, -1);
    return object;
  }, []);
  const intensity = fixtureRenderIntensity(light, light.kind, intensityScale);
  const widthMm = Number(light.parameters.widthMm ?? 1000);
  const heightMm = Number(light.parameters.heightMm ?? 20);
  const rotation = roomLightRotation(light.rotation);
  return <group position={[light.position.x / 1000, light.position.y / 1000, light.position.z / 1000]} rotation={rotation}>
    <primitive object={target} />
    <mesh rotation={light.kind === "spot" ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
      {light.kind === "area" ? <boxGeometry args={[widthMm / 1000, heightMm / 1000, 0.012]} />
        : light.kind === "spot" ? <cylinderGeometry args={[0.05, 0.05, 0.02, 24]} />
          : <sphereGeometry args={[0.06, 16, 12]} />}
      <meshStandardMaterial color={light.enabled ? light.color : "#dedbd5"} roughness={0.45}
        emissive={light.color} emissiveIntensity={fixtureEmissiveIntensity(light)} />
    </mesh>
    {light.kind === "area"
      ? <rectAreaLight position={[0, 0, -0.012]} color={light.color} intensity={intensity} width={widthMm / 1000} height={heightMm / 1000} />
      : light.kind === "spot" ? <spotLight position={[0, 0, -0.025]} target={target} color={light.color} intensity={intensity}
          distance={Number(light.parameters.rangeMm ?? 5000) / 1000} angle={Math.PI / 5} penumbra={0.65} castShadow={castShadow && light.enabled} />
        : <pointLight color={light.color} intensity={intensity} distance={Number(light.parameters.rangeMm ?? 5000) / 1000} castShadow={castShadow && light.enabled} />}
  </group>;
}
