import type { CabinetInstance } from "../cabinetDimensions";
import type { CabinetConstruction } from "../cabinetConstruction";
import { getResolvedDoorCount, resolveCabinetComposition } from "../cabinetComposition";
import { getHardwareItem, normalizeCabinetHardware } from "./normalize";
import type { HardwareLine } from "./types";
import { layoutCabinetElevationFace } from "../openingLayout";

export function resolveHardwareCounts(
  cabinet: CabinetInstance,
  construction: CabinetConstruction,
): {
  doorCount: number;
  hingeCount: number;
  drawerCount: number;
  handleCount: number;
  shelfCount: number;
} {
  const composition = resolveCabinetComposition(cabinet.config);
  const doorCount = Math.max(
    getResolvedDoorCount(cabinet.config),
    construction.parts.find((part) => part.category === "Door")?.quantity ?? 0,
  );
  const drawerCount = Math.max(
    composition.drawers.count,
    construction.parts
      .filter((part) => part.category === "DrawerBox")
      .reduce((sum, part) => Math.max(sum, Math.ceil(part.quantity / 2)), 0),
  );
  const drawerFrontCount =
    construction.parts.find((part) => part.category === "DrawerFront")?.quantity ??
    drawerCount;
  const shelfCount = Math.max(
    composition.shelves.count,
    construction.parts.find((part) => part.category === "Shelf")?.quantity ?? 0,
  );
  const hingeCount = layoutCabinetElevationFace(cabinet.config).openings.reduce(
    (sum, opening) => {
      if (opening.contentType !== "door") return sum;
      const leaves = opening.doorStyle === "single" ? 1 : 2;
      const perLeaf = opening.heightMm > 1500 ? 4 : opening.heightMm > 900 ? 3 : 2;
      return sum + leaves * perLeaf;
    },
    0,
  );

  return {
    doorCount,
    hingeCount,
    drawerCount,
    handleCount: doorCount + drawerFrontCount,
    shelfCount,
  };
}

export function buildHardwareLines(
  cabinet: CabinetInstance,
  construction: CabinetConstruction,
  settings: {
    hingeId: string;
    drawerSlideId: string;
    handleId: string;
  },
): HardwareLine[] {
  const hardware = normalizeCabinetHardware(
    cabinet.config.type,
    cabinet.config.hardware,
    settings,
  );
  const counts = resolveHardwareCounts(cabinet, construction);
  const lines: HardwareLine[] = [];

  function push(id: string, quantity: number) {
    if (quantity <= 0 || id === "none") return;
    const item = getHardwareItem(id);
    if (!item) return;
    lines.push({
      id: item.id,
      label: item.label,
      kind: item.kind,
      quantity,
      unitCost: item.costPerUnit,
      totalCost: Math.round(item.costPerUnit * quantity),
    });
  }

  const insertBlocksDrawers =
    hardware.insertKind === "sink-bowl" ||
    hardware.insertKind === "dishwasher-gap" ||
    hardware.insertKind === "cooktop";

  push(hardware.hingeId, counts.hingeCount);
  push(
    hardware.slideId,
    insertBlocksDrawers ? 0 : counts.drawerCount,
  );
  push(hardware.handleId, counts.handleCount);

  if (
    hardware.includeShelfPins &&
    construction.constructionSpec.shelfMount === "adjustable-pins"
  ) {
    push("shelf-pin", counts.shelfCount * 4);
  }

  push("connector", 8);
  push("screw-pack", 1);

  if (cabinet.placement.attachment === "floor") {
    push(hardware.legId, hardware.legId === "none" ? 0 : 4);
  } else {
    push(hardware.bracketId, hardware.bracketId === "none" ? 0 : 2);
  }

  for (const accessory of hardware.accessories) {
    push(accessory.id, accessory.quantity);
  }

  return lines;
}
