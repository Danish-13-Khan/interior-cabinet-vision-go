import type {
  CabinetPanelGeometry,
  PanelName,
} from "../domain/cabinetGeometry";
import { CabinetPanel } from "./CabinetPanel";

type CabinetProps = {
  cabinetId: string;
  panels: CabinetPanelGeometry[];
  hoveredPanelName: PanelName | null;
  isolatedPanelName: PanelName | null;
  selectedPanelName: PanelName | null;
  isCabinetSelected: boolean;
  onHoverPanel: (cabinetId: string, name: PanelName | null) => void;
  onSelectPanel: (cabinetId: string, name: PanelName) => void;
};

export function Cabinet({
  cabinetId,
  panels,
  hoveredPanelName,
  isolatedPanelName,
  selectedPanelName,
  isCabinetSelected,
  onHoverPanel,
  onSelectPanel,
}: CabinetProps) {
  const visiblePanels = isolatedPanelName
    ? panels.filter((panel) => panel.name === isolatedPanelName)
    : panels;

  return (
    <group>
      {visiblePanels.map((panel) => (
        <CabinetPanel
          key={panel.name}
          {...panel}
          isHovered={panel.name === hoveredPanelName}
          isSelected={panel.name === selectedPanelName}
          isCabinetSelected={isCabinetSelected}
          onHover={(name) => onHoverPanel(cabinetId, name)}
          onSelect={(name) => onSelectPanel(cabinetId, name)}
        />
      ))}
    </group>
  );
}
