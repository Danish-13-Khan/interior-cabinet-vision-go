import { useMemo } from "react";
import { Object3D } from "three";
import type { LightEntity } from "../../domain/interiorProject";

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
  const intensity = light.enabled ? light.intensity * intensityScale : 0;
  const width = Number(light.parameters.widthMm ?? 1000) / 1000;
  const height = Number(light.parameters.heightMm ?? 20) / 1000;
  const rotation = [light.rotation.x, light.rotation.y, light.rotation.z].map((value) => value * Math.PI / 180) as [number, number, number];
  return <group position={[light.position.x / 1000, light.position.y / 1000, light.position.z / 1000]} rotation={rotation}>
    <primitive object={target} />
    <mesh rotation={light.kind === "spot" ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
      {light.kind === "area" ? <boxGeometry args={[width, height, 0.012]} />
        : light.kind === "spot" ? <cylinderGeometry args={[0.05, 0.05, 0.02, 24]} />
          : <sphereGeometry args={[0.06, 16, 12]} />}
      <meshStandardMaterial color={light.enabled ? light.color : "#dedbd5"} roughness={0.45}
        emissive={light.color} emissiveIntensity={light.enabled ? Math.min(3, light.intensity * 0.2) : 0} />
    </mesh>
    {light.kind === "area" ? <rectAreaLight position={[0, 0, -0.012]} color={light.color} intensity={intensity} width={width} height={height} />
      : light.kind === "spot" ? <spotLight position={[0, 0, -0.025]} target={target} color={light.color} intensity={intensity}
          distance={Number(light.parameters.rangeMm ?? 5000) / 1000} angle={Math.PI / 5} penumbra={0.65} castShadow={castShadow && light.enabled} />
        : <pointLight color={light.color} intensity={intensity} distance={Number(light.parameters.rangeMm ?? 5000) / 1000} castShadow={castShadow && light.enabled} />}
  </group>;
}
