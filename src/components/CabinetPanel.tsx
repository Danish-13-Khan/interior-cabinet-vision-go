import { Edges } from "@react-three/drei";
import type { CabinetPanelGeometry, PanelName } from "../domain/cabinetGeometry";

type CabinetPanelProps = CabinetPanelGeometry & {
  isHovered: boolean;
  isSelected: boolean;
  isCabinetSelected: boolean;
  onHover: (name: PanelName | null) => void;
  onSelect: (name: PanelName) => void;
};

function getPanelColor(
  material: CabinetPanelGeometry["material"],
  isHovered: boolean,
  isSelected: boolean,
  isCabinetSelected: boolean,
) {
  if (isSelected) {
    return "#e8c68e";
  }

  if (isHovered) {
    return "#ddc096";
  }

  switch (material) {
    case "back":
      return isCabinetSelected ? "#cdb490" : "#c7ae86";
    case "door":
      return isCabinetSelected ? "#ddbf93" : "#d7b98d";
    default:
      return isCabinetSelected ? "#d6b78c" : "#d0b186";
  }
}

export function CabinetPanel({
  name,
  size,
  position,
  material,
  isHovered,
  isSelected,
  isCabinetSelected,
  onHover,
  onSelect,
}: CabinetPanelProps) {
  const edgeColor = isSelected
    ? "#3f2d18"
    : isHovered
      ? "#5a4227"
      : isCabinetSelected
        ? "#8b7557"
        : "#7b6547";

  const edgeThreshold = isSelected ? 12 : isHovered ? 14 : isCabinetSelected ? 14 : 15;

  return (
    <mesh
      name={name}
      position={position}
      castShadow
      receiveShadow
      onPointerEnter={(event) => {
        event.stopPropagation();
        onHover(name);
      }}
      onPointerLeave={() => onHover(null)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(name);
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={getPanelColor(material, isHovered, isSelected, isCabinetSelected)}
        roughness={0.74}
        metalness={0.05}
        emissive={
          isSelected ? "#73582b" : isHovered ? "#604a29" : isCabinetSelected ? "#3a2812" : "#000000"
        }
        emissiveIntensity={
          isSelected ? 0.2 : isHovered ? 0.08 : isCabinetSelected ? 0.04 : 0
        }
      />
      <Edges color={edgeColor} threshold={edgeThreshold} />
    </mesh>
  );
}
