import type { CabinetInstance } from "../cabinetDimensions";
import type { CabinetConstruction } from "../cabinetConstruction";
import { getResolvedDoorCount, resolveCabinetComposition } from "../cabinetComposition";
import { getHardwareItem, normalizeCabinetHardware } from "./normalize";
import type { HardwareLine } from "./types";
import { layoutCabinetElevationFace } from "../openingLayout";
import { handledFrontCount, resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import { doorGlassSquareMetres } from "../cabinetConstruction/partsDoors";
import { GOLA_PROFILE_CATALOG } from "../frontSystem/golaProfiles";
import {
  PUSH_DOOR_HINGE_ID,
  PUSH_DRAWER_SLIDE_ID,
  PUSH_MECHANISM_HARDWARE,
} from "../frontSystem/pushDefaults";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { slidingHardwareQuantities } from "./slidingHardware";

/** Metres of each gola profile on this cabinet; summed across a run by the hardware schedule. */
export function golaProfileMetres(config: CabinetInstance["config"]): Map<string, number> {
  const metres = new Map<string, number>();
  for (const band of resolveFrontGaps(config).profiles) {
    const id = GOLA_PROFILE_CATALOG[band.kind].hardwareId;
    metres.set(id, Math.round(((metres.get(id) ?? 0) + band.lengthMm / 1000) * 100) / 100);
  }
  return metres;
}

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
  const fronts = resolveFrontGaps(cabinet.config);
  const doorCount = Math.max(
    getResolvedDoorCount(cabinet.config),
    fronts.openings.filter((entry) => entry.kind === "door").reduce((sum, entry) => sum + entry.leaves.length, 0),
  );
  const drawerCount = Math.max(
    composition.drawers.count,
    construction.parts
      .filter((part) => part.category === "DrawerBox")
      .reduce((sum, part) => Math.max(sum, Math.ceil(part.quantity / 2)), 0),
  );
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
    /** Same fronts the 3D model puts handles on; gola-gripped fronts skip. */
    handleCount: handledFrontCount(fronts),
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
      ...(item.unconfirmedDefault ? { unconfirmedDefault: true as const } : {}),
    });
  }

  const insertBlocksDrawers =
    hardware.insertKind === "sink-bowl" ||
    hardware.insertKind === "dishwasher-gap" ||
    hardware.insertKind === "cooktop";

  const spec = normalizeConstructionSpec(cabinet.config.type, cabinet.config.construction);
  const frontSystem = spec.frontSystem;
  const isPush = frontSystem?.kind === "push";
  const pushMechanism = isPush ? frontSystem.mechanism : null;

  // Soft-close hinges fight mechanical push / Tip-On — schedule spring-free (Ilyas Q).
  // Sliding wardrobes schedule zero hinges: track + rollers + flush pulls instead (§3.4).
  push(isPush ? PUSH_DOOR_HINGE_ID : hardware.hingeId, spec.sliding ? 0 : counts.hingeCount);
  if (spec.sliding) {
    for (const [id, quantity] of slidingHardwareQuantities(cabinet.config, spec.sliding, resolveFrontGaps(cabinet.config))) {
      push(id, quantity);
    }
  }
  // Q2: push fronts use push-open runners; drawers then need no separate latch.
  const slideId = isPush ? PUSH_DRAWER_SLIDE_ID : hardware.slideId;
  push(slideId, insertBlocksDrawers ? 0 : counts.drawerCount);
  push(hardware.handleId, isPush ? 0 : counts.handleCount);
  if (isPush && pushMechanism) {
    const fronts = resolveFrontGaps(cabinet.config);
    // Q2: one latch per door leaf; drawers use push slides (no separate latch).
    const doorLeaves = fronts.openings
      .filter((entry) => entry.kind === "door")
      .reduce((sum, entry) => sum + entry.leaves.length, 0);
    push(PUSH_MECHANISM_HARDWARE[pushMechanism], doorLeaves);
  }
  for (const [id, metres] of golaProfileMetres(cabinet.config)) push(id, metres);
  push("door-glass", doorGlassSquareMetres(cabinet.config));

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
