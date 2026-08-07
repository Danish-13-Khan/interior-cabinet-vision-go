import type { CabinetInstance, CabinetType } from "./cabinetDimensions";
import type { CabinetConstruction } from "./cabinetConstruction";
import { getResolvedDoorCount, resolveCabinetComposition } from "./cabinetComposition";

export type HardwareKind =
  | "hinge"
  | "slide"
  | "handle"
  | "leg"
  | "bracket"
  | "shelf-pin"
  | "accessory"
  | "consumable";

export type HardwareItem = {
  id: string;
  label: string;
  kind: HardwareKind;
  costPerUnit: number;
  description?: string;
  /** For slides: nominal length hint in mm */
  lengthMm?: number;
  softClose?: boolean;
  pair?: boolean;
};

export type ApplianceInsertKind =
  | "none"
  | "sink-bowl"
  | "cooktop"
  | "dishwasher-gap";

export type CabinetAccessoryLine = {
  id: string;
  quantity: number;
};

export type CabinetHardwareSpec = {
  hingeId: string;
  slideId: string;
  handleId: string;
  legId: string;
  bracketId: string;
  includeShelfPins: boolean;
  accessories: CabinetAccessoryLine[];
  insertKind: ApplianceInsertKind;
};

export type HardwareLine = {
  id: string;
  label: string;
  kind: HardwareKind;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

export type HardwareScheduleRow = {
  hardwareId: string;
  label: string;
  kind: HardwareKind;
  quantity: number;
  unitCost: number;
  totalCost: number;
  cabinetCount: number;
  cabinetMarks: string[];
};

export type CabinetHardwareSummary = {
  cabinetId: string;
  cabinetName: string;
  mark: string;
  insertKind: ApplianceInsertKind;
  lines: HardwareLine[];
  totalCost: number;
};

export const HARDWARE_CATALOG: HardwareItem[] = [
  {
    id: "hinge-soft",
    label: "Soft-close hinge",
    kind: "hinge",
    costPerUnit: 85,
    softClose: true,
    description: "110° overlay soft-close",
  },
  {
    id: "hinge-standard",
    label: "Standard hinge",
    kind: "hinge",
    costPerUnit: 25,
    softClose: false,
    description: "Basic overlay hinge",
  },
  {
    id: "hinge-inset",
    label: "Inset soft-close hinge",
    kind: "hinge",
    costPerUnit: 95,
    softClose: true,
    description: "For inset door mounts",
  },
  {
    id: "drawer-slide-soft",
    label: "Soft-close drawer slide (pair)",
    kind: "slide",
    costPerUnit: 280,
    softClose: true,
    pair: true,
    lengthMm: 450,
  },
  {
    id: "drawer-slide-standard",
    label: "Standard drawer slide (pair)",
    kind: "slide",
    costPerUnit: 120,
    softClose: false,
    pair: true,
    lengthMm: 450,
  },
  {
    id: "drawer-slide-undermount",
    label: "Undermount soft-close slide (pair)",
    kind: "slide",
    costPerUnit: 420,
    softClose: true,
    pair: true,
    lengthMm: 500,
  },
  {
    id: "handle-bar",
    label: "Bar handle",
    kind: "handle",
    costPerUnit: 95,
  },
  {
    id: "handle-knob",
    label: "Knob handle",
    kind: "handle",
    costPerUnit: 40,
  },
  {
    id: "handle-cup",
    label: "Cup pull",
    kind: "handle",
    costPerUnit: 70,
  },
  {
    id: "shelf-pin",
    label: "Shelf support pin",
    kind: "shelf-pin",
    costPerUnit: 8,
  },
  {
    id: "leg-adj",
    label: "Adjustable leg",
    kind: "leg",
    costPerUnit: 45,
  },
  {
    id: "leg-plinth",
    label: "Plinth clip set",
    kind: "leg",
    costPerUnit: 30,
    description: "For toe-kick / plinth support",
  },
  {
    id: "wall-bracket",
    label: "Wall mounting bracket",
    kind: "bracket",
    costPerUnit: 55,
  },
  {
    id: "wall-rail",
    label: "Wall hanging rail set",
    kind: "bracket",
    costPerUnit: 180,
  },
  {
    id: "connector",
    label: "Cam+dowel connector set",
    kind: "consumable",
    costPerUnit: 12,
  },
  {
    id: "screw-pack",
    label: "Screw pack (50pcs)",
    kind: "consumable",
    costPerUnit: 35,
  },
  {
    id: "basket-wire",
    label: "Wire basket",
    kind: "accessory",
    costPerUnit: 450,
    description: "Pull-out wire storage basket",
  },
  {
    id: "basket-pullout",
    label: "Full-extension pull-out basket",
    kind: "accessory",
    costPerUnit: 980,
  },
  {
    id: "trash-pullout",
    label: "Trash pull-out",
    kind: "accessory",
    costPerUnit: 1200,
    description: "Compatible with sink bases",
  },
  {
    id: "tray-cutlery",
    label: "Cutlery tray",
    kind: "accessory",
    costPerUnit: 220,
  },
];

export const APPLIANCE_INSERT_OPTIONS: Array<{
  value: ApplianceInsertKind;
  label: string;
}> = [
  { value: "none", label: "None" },
  { value: "sink-bowl", label: "Sink bowl" },
  { value: "cooktop", label: "Cooktop cutout" },
  { value: "dishwasher-gap", label: "Dishwasher gap" },
];

export const ACCESSORY_CATALOG_IDS = HARDWARE_CATALOG.filter(
  (item) => item.kind === "accessory",
).map((item) => item.id);

export const DEFAULT_HARDWARE_SPEC: CabinetHardwareSpec = {
  hingeId: "hinge-soft",
  slideId: "drawer-slide-soft",
  handleId: "handle-bar",
  legId: "leg-adj",
  bracketId: "wall-bracket",
  includeShelfPins: true,
  accessories: [],
  insertKind: "none",
};

export function getHardwareItem(id: string): HardwareItem | undefined {
  return HARDWARE_CATALOG.find((item) => item.id === id);
}

export function hardwareItemsOfKind(kind: HardwareKind): HardwareItem[] {
  return HARDWARE_CATALOG.filter((item) => item.kind === kind);
}

export function defaultInsertKindForType(type: CabinetType): ApplianceInsertKind {
  if (type === "sink") return "sink-bowl";
  return "none";
}

export function isAccessoryCompatible(
  accessoryId: string,
  type: CabinetType,
  insertKind: ApplianceInsertKind,
): boolean {
  if (!ACCESSORY_CATALOG_IDS.includes(accessoryId)) return false;
  if (insertKind === "dishwasher-gap") return false;
  if (insertKind === "cooktop") {
    return accessoryId === "tray-cutlery";
  }
  if (type === "sink" || insertKind === "sink-bowl") {
    return accessoryId === "trash-pullout" || accessoryId === "basket-wire";
  }
  if (type === "wall" || type === "open-shelf") {
    return accessoryId === "basket-wire" || accessoryId === "tray-cutlery";
  }
  return true;
}

export function normalizeCabinetHardware(
  type: CabinetType,
  hardware: Partial<CabinetHardwareSpec> | undefined,
  defaults: {
    hingeId: string;
    drawerSlideId: string;
    handleId: string;
  } = {
    hingeId: "hinge-soft",
    drawerSlideId: "drawer-slide-soft",
    handleId: "handle-bar",
  },
): CabinetHardwareSpec {
  const hingeIds = new Set(hardwareItemsOfKind("hinge").map((item) => item.id));
  const slideIds = new Set(hardwareItemsOfKind("slide").map((item) => item.id));
  const handleIds = new Set(hardwareItemsOfKind("handle").map((item) => item.id));
  const legIds = new Set(["none", ...hardwareItemsOfKind("leg").map((item) => item.id)]);
  const bracketIds = new Set([
    "none",
    ...hardwareItemsOfKind("bracket").map((item) => item.id),
  ]);
  const insertOptions = new Set(APPLIANCE_INSERT_OPTIONS.map((item) => item.value));

  const seed = {
    ...DEFAULT_HARDWARE_SPEC,
    hingeId: defaults.hingeId,
    slideId: defaults.drawerSlideId,
    handleId: defaults.handleId,
    insertKind: defaultInsertKindForType(type),
    ...(hardware ?? {}),
  };

  const insertKind = insertOptions.has(seed.insertKind)
    ? seed.insertKind
    : defaultInsertKindForType(type);

  const accessories = Array.isArray(seed.accessories)
    ? seed.accessories
        .map((line) => ({
          id: String(line?.id ?? ""),
          quantity: Math.min(6, Math.max(0, Math.round(Number(line?.quantity) || 0))),
        }))
        .filter(
          (line) =>
            line.quantity > 0 && isAccessoryCompatible(line.id, type, insertKind),
        )
        .slice(0, 8)
    : [];

  // Sink / insert compatibility: dishwasher gap clears accessories and doors hardware still ok
  if (type === "sink" && insertKind === "none") {
    // keep sink-bowl as practical default when unspecified incorrectly
  }

  return {
    hingeId: hingeIds.has(seed.hingeId) ? seed.hingeId : DEFAULT_HARDWARE_SPEC.hingeId,
    slideId: slideIds.has(seed.slideId) ? seed.slideId : DEFAULT_HARDWARE_SPEC.slideId,
    handleId: handleIds.has(seed.handleId) ? seed.handleId : DEFAULT_HARDWARE_SPEC.handleId,
    legId: legIds.has(seed.legId) ? seed.legId : DEFAULT_HARDWARE_SPEC.legId,
    bracketId: bracketIds.has(seed.bracketId)
      ? seed.bracketId
      : DEFAULT_HARDWARE_SPEC.bracketId,
    includeShelfPins: seed.includeShelfPins !== false,
    accessories,
    insertKind:
      type === "sink" && insertKind === "none" ? "sink-bowl" : insertKind,
  };
}

export function describeHardwareSpec(spec: CabinetHardwareSpec): string {
  const hinge = getHardwareItem(spec.hingeId)?.label ?? spec.hingeId;
  const slide = getHardwareItem(spec.slideId)?.label ?? spec.slideId;
  const handle = getHardwareItem(spec.handleId)?.label ?? spec.handleId;
  const accessoryCount = spec.accessories.reduce((sum, line) => sum + line.quantity, 0);
  const insert =
    APPLIANCE_INSERT_OPTIONS.find((item) => item.value === spec.insertKind)?.label ??
    "None";
  return `${hinge} · ${slide} · ${handle}${accessoryCount ? ` · ${accessoryCount} acc.` : ""} · ${insert}`;
}

export function resolveHardwareCounts(
  cabinet: CabinetInstance,
  construction: CabinetConstruction,
): {
  doorCount: number;
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

  return {
    doorCount,
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

  push(hardware.hingeId, counts.doorCount * 2);
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

export function createHardwareSchedule(
  cabinets: CabinetInstance[],
  perCabinetLines: Map<string, HardwareLine[]>,
  marks?: Map<string, string>,
): { project: HardwareScheduleRow[]; byCabinet: CabinetHardwareSummary[] } {
  const rollup = new Map<
    string,
    HardwareScheduleRow & { markSet: Set<string> }
  >();
  const byCabinet: CabinetHardwareSummary[] = [];

  cabinets.forEach((cabinet, index) => {
    const lines = perCabinetLines.get(cabinet.id) ?? [];
    const mark = marks?.get(cabinet.id) ?? `C${String(index + 1).padStart(2, "0")}`;
    const hardware = normalizeCabinetHardware(
      cabinet.config.type,
      cabinet.config.hardware,
    );
    byCabinet.push({
      cabinetId: cabinet.id,
      cabinetName: cabinet.name,
      mark,
      insertKind: hardware.insertKind,
      lines,
      totalCost: lines.reduce((sum, line) => sum + line.totalCost, 0),
    });

    for (const line of lines) {
      const existing = rollup.get(line.id);
      if (!existing) {
        rollup.set(line.id, {
          hardwareId: line.id,
          label: line.label,
          kind: line.kind,
          quantity: line.quantity,
          unitCost: line.unitCost,
          totalCost: line.totalCost,
          cabinetCount: 1,
          cabinetMarks: [mark],
          markSet: new Set([mark]),
        });
        continue;
      }
      existing.quantity += line.quantity;
      existing.totalCost += line.totalCost;
      if (!existing.markSet.has(mark)) {
        existing.markSet.add(mark);
        existing.cabinetMarks.push(mark);
        existing.cabinetCount += 1;
      }
    }
  });

  const project = Array.from(rollup.values())
    .map(({ markSet: _markSet, ...row }) => ({
      ...row,
      totalCost: Math.round(row.totalCost),
    }))
    .sort((a, b) => b.totalCost - a.totalCost || a.label.localeCompare(b.label));

  return { project, byCabinet };
}

export function csvFromHardwareSchedule(rows: HardwareScheduleRow[]): string {
  const header = [
    "Hardware",
    "Kind",
    "Qty",
    "Unit Cost",
    "Total",
    "Cabinets",
    "Marks",
  ];
  const body = rows.map((row) => [
    row.label,
    row.kind,
    String(row.quantity),
    String(row.unitCost),
    String(row.totalCost),
    String(row.cabinetCount),
    row.cabinetMarks.join(" "),
  ]);
  return [header, ...body]
    .map((line) =>
      line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

/** Thin helper used by manufacturing / UI messages */
export function getInsertCompatibilityNotes(
  type: CabinetType,
  insertKind: ApplianceInsertKind,
): string[] {
  const notes: string[] = [];
  if (insertKind === "sink-bowl") {
    notes.push("Sink bowl insert: avoid drawers under bowl; trash pull-out is preferred.");
  }
  if (insertKind === "cooktop") {
    notes.push("Cooktop cutout: heat clearance required; drawers above heat zone discouraged.");
  }
  if (insertKind === "dishwasher-gap") {
    notes.push("Dishwasher gap: no carcass doors/drawers in this bay.");
  }
  if (type === "sink" && insertKind === "none") {
    notes.push("Sink cabinets should specify a sink-bowl insert.");
  }
  return notes;
}
