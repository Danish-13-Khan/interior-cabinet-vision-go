import { useEffect } from "react";
import type { CabinetInstance, CabinetProject } from "../domain/cabinetDimensions";
import { resolveCabinetComposition } from "../domain/cabinetComposition";
import { findOpeningNode } from "../domain/cabinetOpeningStructure";

type OpeningSelection = { cabinetId: string; openingId: string } | null;

/** Drop the opening highlight when the cabinet or the opening itself is gone. */
export function useActiveOpening(
  project: CabinetProject,
  activeCabinetId: string | null,
  activeOpeningSelection: OpeningSelection,
  setActiveOpeningSelection: (next: OpeningSelection) => void,
  selectedCabinet: CabinetInstance | null,
) {
  useEffect(() => {
    if (!activeOpeningSelection) return;
    if (activeOpeningSelection.cabinetId !== activeCabinetId) {
      setActiveOpeningSelection(null);
      return;
    }
    const cabinet = project.cabinets.find((item) => item.id === activeOpeningSelection.cabinetId);
    const structure = cabinet ? resolveCabinetComposition(cabinet.config).openingStructure : null;
    if (!structure) {
      setActiveOpeningSelection(null);
      return;
    }
    if (!findOpeningNode(structure.root, activeOpeningSelection.openingId)) {
      setActiveOpeningSelection({ cabinetId: activeOpeningSelection.cabinetId, openingId: structure.activeOpeningId });
    }
  }, [activeCabinetId, activeOpeningSelection, project, setActiveOpeningSelection]);

  if (activeOpeningSelection?.cabinetId === activeCabinetId) return activeOpeningSelection.openingId;
  return selectedCabinet
    ? resolveCabinetComposition(selectedCabinet.config).openingStructure?.activeOpeningId ?? null
    : null;
}
