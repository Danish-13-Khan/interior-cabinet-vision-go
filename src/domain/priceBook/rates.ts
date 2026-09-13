import type { CostRateOverrides } from "../costingRates";
import type { PriceBook } from "./types";

/** Flatten the editable book into the rate table costing.ts already understands. */
export function toCostRateOverrides(book: PriceBook): CostRateOverrides {
  const boards: NonNullable<CostRateOverrides["boards"]> = {};
  for (const row of book.boards) {
    const byThickness = boards[row.materialId] ?? {};
    byThickness[row.thicknessMm] = row.costPerM2;
    boards[row.materialId] = byThickness;
  }
  const finishes: NonNullable<CostRateOverrides["finishes"]> = {};
  for (const row of book.finishes) {
    finishes[row.finishId] = row.costPerM2;
  }
  const edges: NonNullable<CostRateOverrides["edges"]> = {};
  for (const row of book.edges) {
    edges[row.edgeBandingId] = row.costPerM;
  }
  const hardware: NonNullable<CostRateOverrides["hardware"]> = {};
  for (const row of book.hardware) {
    hardware[row.hardwareId] = row.costPerUnit;
  }
  return { boards, finishes, edges, hardware };
}

export function patchBoardRate(
  book: PriceBook,
  materialId: string,
  thicknessMm: number,
  costPerM2: number,
): PriceBook {
  const boards = book.boards.map((row) =>
    row.materialId === materialId && row.thicknessMm === thicknessMm
      ? { ...row, costPerM2 }
      : row,
  );
  const exists = boards.some(
    (row) => row.materialId === materialId && row.thicknessMm === thicknessMm,
  );
  return {
    ...book,
    boards: exists
      ? boards
      : [...boards, { materialId: materialId as PriceBook["boards"][number]["materialId"], thicknessMm, costPerM2 }],
    updatedAt: new Date().toISOString(),
  };
}

export function patchHardwareRate(
  book: PriceBook,
  hardwareId: string,
  costPerUnit: number,
): PriceBook {
  return {
    ...book,
    hardware: book.hardware.map((row) =>
      row.hardwareId === hardwareId ? { ...row, costPerUnit } : row,
    ),
    updatedAt: new Date().toISOString(),
  };
}
