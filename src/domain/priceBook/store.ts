import { defaultStorage, type StorageLike } from "../saas/accountTypes";
import { clampPriceBook } from "./clamp";
import { createDefaultPriceBook, createOrgPriceBookStub } from "./defaults";
import type { OrgPriceBookStub, PriceBook } from "./types";

export const PRICE_BOOK_STORAGE_KEY = "cabinet-studio-price-book-v1";

export function readPersonalPriceBook(
  storage: StorageLike | null = defaultStorage(),
  ownerKey = "local",
): PriceBook {
  if (!storage) return createDefaultPriceBook(ownerKey);
  try {
    const raw = storage.getItem(PRICE_BOOK_STORAGE_KEY);
    if (!raw) return createDefaultPriceBook(ownerKey);
    return clampPriceBook({
      ...(JSON.parse(raw) as Partial<PriceBook>),
      scope: "personal",
      ownerKey,
    });
  } catch {
    return createDefaultPriceBook(ownerKey);
  }
}

export function persistPersonalPriceBook(
  book: PriceBook,
  storage: StorageLike | null = defaultStorage(),
): PriceBook {
  const next = clampPriceBook({
    ...book,
    scope: "personal",
    updatedAt: new Date().toISOString(),
  });
  if (storage) {
    storage.setItem(PRICE_BOOK_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearPersonalPriceBook(
  storage: StorageLike | null = defaultStorage(),
): void {
  storage?.removeItem(PRICE_BOOK_STORAGE_KEY);
}

/** Company shared org book — schema stub only (Phase D). */
export function readOrgPriceBookStub(): OrgPriceBookStub {
  return createOrgPriceBookStub();
}
