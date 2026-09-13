import { BOARD_MATERIALS, EDGE_BANDING_OPTIONS, FINISHES } from "../materialSystem";
import { HARDWARE_CATALOG } from "../hardwareSystem";
import { clampCostingSettings } from "../costingSettings";
import { clampQuoteSettings } from "../quoteSettings";
import {
  createDefaultPriceBook,
  DEFAULT_PRICE_BOOK_LABOUR,
  DEFAULT_PRICE_BOOK_QUOTE,
  DEFAULT_PRICE_BOOK_WORKSHOP,
  DEFAULT_SHOP_THICKNESS,
  SHOP_THICKNESS_CHOICES,
} from "./defaults";
import type {
  BoardRate,
  EdgeRate,
  FinishRate,
  HardwareRate,
  PriceBook,
  PriceBookLabour,
  PriceBookQuoteDefaults,
  PriceBookWorkshop,
  ShopThicknessDefaults,
} from "./types";
import { clampInteriorRates } from "./interiorRates";

const BOARD_IDS = new Set(BOARD_MATERIALS.map((item) => item.id));
const FINISH_IDS = new Set(FINISHES.map((item) => item.id));
const EDGE_IDS = new Set(EDGE_BANDING_OPTIONS.map((item) => item.id));
const HARDWARE_IDS = new Set(HARDWARE_CATALOG.map((item) => item.id));
const THICKNESS_SET = new Set<number>(SHOP_THICKNESS_CHOICES);

function money(value: unknown, fallback = 0): number {
  return Math.max(0, Math.round(Number(value) || fallback));
}

function overlayByKey<T>(defaults: T[], incoming: T[] | undefined, keyOf: (row: T) => string): T[] {
  const map = new Map(defaults.map((row) => [keyOf(row), row]));
  for (const row of incoming ?? []) {
    map.set(keyOf(row), row);
  }
  return [...map.values()];
}

export function clampPriceBookLabour(
  value: Partial<PriceBookLabour> | undefined,
): PriceBookLabour {
  const seed = { ...DEFAULT_PRICE_BOOK_LABOUR, ...(value ?? {}) };
  const workshop = clampCostingSettings({
    labourPercent: seed.workshopPercent,
    labourAllowance: seed.workshopAllowance,
  });
  const quote = clampQuoteSettings({ labourAllowance: seed.quoteAllowance });
  return {
    workshopPercent: workshop.labourPercent,
    workshopAllowance: workshop.labourAllowance,
    quoteAllowance: quote.labourAllowance,
  };
}

export function clampPriceBookWorkshop(
  value: Partial<PriceBookWorkshop> | undefined,
): PriceBookWorkshop {
  const seed = { ...DEFAULT_PRICE_BOOK_WORKSHOP, ...(value ?? {}) };
  const safe = clampCostingSettings(seed);
  return {
    wastePercent: safe.wastePercent,
    hardwareAllowance: safe.hardwareAllowance,
    materialRateMultiplier: safe.materialRateMultiplier,
    finishRateMultiplier: safe.finishRateMultiplier,
    hingeId: safe.hingeId,
    drawerSlideId: safe.drawerSlideId,
    handleId: safe.handleId,
  };
}

export function clampPriceBookQuoteDefaults(
  value: Partial<PriceBookQuoteDefaults> | undefined,
): PriceBookQuoteDefaults {
  const seed = { ...DEFAULT_PRICE_BOOK_QUOTE, ...(value ?? {}) };
  const safe = clampQuoteSettings(seed);
  return {
    markupPercent: safe.markupPercent,
    discountPercent: safe.discountPercent,
    taxPercent: safe.taxPercent,
    finishPremiumPercent: safe.finishPremiumPercent,
  };
}

export function clampShopThickness(
  value: Partial<ShopThicknessDefaults> | undefined,
): ShopThicknessDefaults {
  const seed = { ...DEFAULT_SHOP_THICKNESS, ...(value ?? {}) };
  const pick = (raw: unknown, fallback: number) => {
    const n = Math.round(Number(raw));
    return THICKNESS_SET.has(n) ? n : fallback;
  };
  return {
    carcassMm: pick(seed.carcassMm, DEFAULT_SHOP_THICKNESS.carcassMm),
    shutterMm: pick(seed.shutterMm, DEFAULT_SHOP_THICKNESS.shutterMm),
    backMm: pick(seed.backMm, DEFAULT_SHOP_THICKNESS.backMm),
  };
}

function clampBoardRate(row: Partial<BoardRate> | undefined): BoardRate | null {
  if (!row || !BOARD_IDS.has(row.materialId as BoardRate["materialId"])) return null;
  const thicknessMm = Math.round(Number(row.thicknessMm));
  if (!Number.isFinite(thicknessMm) || thicknessMm < 3 || thicknessMm > 50) return null;
  return {
    materialId: row.materialId as BoardRate["materialId"],
    thicknessMm,
    costPerM2: money(row.costPerM2),
  };
}

function clampFinishRate(row: Partial<FinishRate> | undefined): FinishRate | null {
  if (!row || !FINISH_IDS.has(row.finishId as FinishRate["finishId"])) return null;
  return { finishId: row.finishId as FinishRate["finishId"], costPerM2: money(row.costPerM2) };
}

function clampEdgeRate(row: Partial<EdgeRate> | undefined): EdgeRate | null {
  if (!row || !EDGE_IDS.has(row.edgeBandingId as EdgeRate["edgeBandingId"])) return null;
  return {
    edgeBandingId: row.edgeBandingId as EdgeRate["edgeBandingId"],
    costPerM: money(row.costPerM),
  };
}

function clampHardwareRate(row: Partial<HardwareRate> | undefined): HardwareRate | null {
  if (!row || !HARDWARE_IDS.has(String(row.hardwareId))) return null;
  return { hardwareId: String(row.hardwareId), costPerUnit: money(row.costPerUnit) };
}

export function clampPriceBook(value?: Partial<PriceBook> | null): PriceBook {
  const base = createDefaultPriceBook(
    typeof value?.ownerKey === "string" ? value.ownerKey : "local",
    value?.scope === "org" ? "org" : "personal",
  );
  const boards = overlayByKey(
    base.boards,
    (value?.boards ?? []).map(clampBoardRate).filter((row): row is BoardRate => Boolean(row)),
    (row) => `${row.materialId}:${row.thicknessMm}`,
  );
  const finishes = overlayByKey(
    base.finishes,
    (value?.finishes ?? []).map(clampFinishRate).filter((row): row is FinishRate => Boolean(row)),
    (row) => row.finishId,
  );
  const edges = overlayByKey(
    base.edges,
    (value?.edges ?? []).map(clampEdgeRate).filter((row): row is EdgeRate => Boolean(row)),
    (row) => row.edgeBandingId,
  );
  const hardware = overlayByKey(
    base.hardware,
    (value?.hardware ?? []).map(clampHardwareRate).filter((row): row is HardwareRate => Boolean(row)),
    (row) => row.hardwareId,
  );
  return {
    ...base,
    updatedAt:
      typeof value?.updatedAt === "string" && value.updatedAt
        ? value.updatedAt
        : base.updatedAt,
    boards,
    finishes,
    edges,
    hardware,
    labour: clampPriceBookLabour(value?.labour),
    workshop: clampPriceBookWorkshop(value?.workshop),
    quoteDefaults: clampPriceBookQuoteDefaults(value?.quoteDefaults),
    shopThickness: clampShopThickness(value?.shopThickness),
    interiorRates: clampInteriorRates(value?.interiorRates),
  };
}
