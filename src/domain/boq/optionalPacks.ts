/**
 * Optional BOQ line packs (Phase F): louvers, area finishes, fixtures.
 * Millwork-first core stays unchanged; these are typed add-on lines.
 */

export type OptionalPackKind = "louvers" | "area_finish" | "fixture";

export type OptionalPackUnit = "each" | "m2" | "lm";

export type OptionalPackSku = {
  id: string;
  kind: OptionalPackKind;
  label: string;
  unit: OptionalPackUnit;
  /** Default shop rate (₹ per unit) — customer may override on the line. */
  defaultUnitRate: number;
  category: string;
  notes?: string;
};

export type OptionalBoqLineInput = {
  skuId: string;
  quantity: number;
  unitRate?: number;
  label?: string;
  notes?: string;
  key?: string;
};

export type OptionalBoqLine = {
  key: string;
  packKind: OptionalPackKind;
  skuId: string;
  category: string;
  label: string;
  unit: OptionalPackUnit;
  quantity: number;
  unitRate: number;
  workshopCost: number;
  sellPrice: number;
  notes: string;
};

/** Starter catalog — rates are defaults, not locked market retail. */
export const OPTIONAL_PACK_SKUS: readonly OptionalPackSku[] = [
  {
    id: "louver.panel.std",
    kind: "louvers",
    label: "Louver panel",
    unit: "m2",
    defaultUnitRate: 2200,
    category: "Louver",
    notes: "Millwork-adjacent wall / window louvers",
  },
  {
    id: "louver.screen.lm",
    kind: "louvers",
    label: "Louver screen",
    unit: "lm",
    defaultUnitRate: 1800,
    category: "Louver",
  },
  {
    id: "finish.paint.wall",
    kind: "area_finish",
    label: "Wall paint",
    unit: "m2",
    defaultUnitRate: 45,
    category: "Paint",
  },
  {
    id: "finish.wallpaper",
    kind: "area_finish",
    label: "Wallpaper",
    unit: "m2",
    defaultUnitRate: 120,
    category: "Wallpaper",
  },
  {
    id: "finish.flooring",
    kind: "area_finish",
    label: "Flooring",
    unit: "m2",
    defaultUnitRate: 350,
    category: "Flooring",
  },
  {
    id: "fixture.tap",
    kind: "fixture",
    label: "Tap",
    unit: "each",
    defaultUnitRate: 2500,
    category: "Fixture",
    notes: "FF&E supply line — not plumbing execution",
  },
  {
    id: "fixture.sink",
    kind: "fixture",
    label: "Sink",
    unit: "each",
    defaultUnitRate: 8500,
    category: "Fixture",
  },
  {
    id: "fixture.mirror",
    kind: "fixture",
    label: "Mirror",
    unit: "each",
    defaultUnitRate: 3200,
    category: "Fixture",
  },
  {
    id: "fixture.jet-shower",
    kind: "fixture",
    label: "Jet shower",
    unit: "each",
    defaultUnitRate: 12000,
    category: "Fixture",
  },
] as const;

export const OPTIONAL_PACK_KIND_LABELS: Record<OptionalPackKind, string> = {
  louvers: "Louvers",
  area_finish: "Area finishes",
  fixture: "Fixtures",
};

export function optionalPackSkuById(id: string): OptionalPackSku | undefined {
  return OPTIONAL_PACK_SKUS.find((sku) => sku.id === id);
}

export function listOptionalPackSkus(kind?: OptionalPackKind): OptionalPackSku[] {
  if (!kind) return [...OPTIONAL_PACK_SKUS];
  return OPTIONAL_PACK_SKUS.filter((sku) => sku.kind === kind);
}

function roundMoney(value: number): number {
  return Math.round(Number.isFinite(value) ? value : 0);
}

export function buildOptionalBoqLine(input: OptionalBoqLineInput): OptionalBoqLine {
  const sku = optionalPackSkuById(input.skuId);
  if (!sku) throw new Error(`Unknown optional pack SKU: ${input.skuId}`);
  const quantity = Math.max(0, Number(input.quantity) || 0);
  const unitRate = Math.max(0, Number(input.unitRate ?? sku.defaultUnitRate) || 0);
  const amount = roundMoney(quantity * unitRate);
  return {
    key: input.key ?? `optional:${sku.id}:${quantity}:${unitRate}`,
    packKind: sku.kind,
    skuId: sku.id,
    category: sku.category,
    label: input.label?.trim() || sku.label,
    unit: sku.unit,
    quantity,
    unitRate,
    workshopCost: amount,
    sellPrice: amount,
    notes: input.notes?.trim() || sku.notes || "",
  };
}

export function buildOptionalBoqLines(inputs: readonly OptionalBoqLineInput[]): OptionalBoqLine[] {
  return inputs.map(buildOptionalBoqLine);
}

export function sumOptionalPackSell(lines: readonly OptionalBoqLine[]): number {
  return lines.reduce((sum, line) => sum + line.sellPrice, 0);
}

export function groupOptionalByKind(
  lines: readonly OptionalBoqLine[],
): Record<OptionalPackKind, OptionalBoqLine[]> {
  const empty: Record<OptionalPackKind, OptionalBoqLine[]> = {
    louvers: [],
    area_finish: [],
    fixture: [],
  };
  for (const line of lines) empty[line.packKind].push(line);
  return empty;
}
