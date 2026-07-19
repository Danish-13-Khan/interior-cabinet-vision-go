import { Line, Text } from "@react-three/drei";
import type { CabinetConfig } from "../domain/cabinetDimensions";
import { createCabinetDimensionGuides } from "../domain/cabinetGeometry";

type DimensionGuidesProps = {
  config: CabinetConfig;
};

export function DimensionGuides({ config }: DimensionGuidesProps) {
  const guides = createCabinetDimensionGuides(config);

  return (
    <group>
      {guides.map((guide) => (
        <group key={guide.id}>
          <Line points={guide.points} color="#7f8b97" lineWidth={1} dashed={false} />
          <Text
            position={guide.labelPosition}
            fontSize={0.04}
            color="#415161"
            anchorX="center"
            anchorY="middle"
          >
            {guide.label}
          </Text>
        </group>
      ))}
    </group>
  );
}
