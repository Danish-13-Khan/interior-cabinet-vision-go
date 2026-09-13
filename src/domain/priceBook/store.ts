import { defaultStorage, type StorageLike } from "../saas/accountTypes";
import { clampPriceBook } from "./clamp";
import { createDefaultPriceBook, createOrgPriceBook } from "./defaults";
import type { OrgPriceBookRecord, PriceBook } from "./types";

export const PRICE_BOOK_STORAGE_KEY = "cabinet-studio-price-book-v1";
export const ORG_PRICE_BOOK_STORAGE_KEY = "cabinet-studio-org-price-book-v1";

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

function clampOrgRecord(
  value: Partial<OrgPriceBookRecord> | null | undefined,
  orgId: string,
): OrgPriceBookRecord {
  const base = createOrgPriceBook(orgId);
  if (!value || typeof value !== "object") return base;
  const book = clampPriceBook({
    ...(value.book ?? base.book),
    scope: "org",
    ownerKey: orgId,
  });
  const seatOverrides = Array.isArray(value.seatOverrides)
    ? value.seatOverrides.filter(
        (row) => row && typeof row.seatId === "string" && row.seatId.trim(),
      )
    : [];
  return {
    scope: "org",
    orgId,
    book,
    seatOverrides,
    updatedAt:
      typeof value.updatedAt === "string" ? value.updatedAt : book.updatedAt,
  };
}

/** Shared org price book — activated in Phase D (was A stub). */
export function readOrgPriceBook(
  orgId: string,
  storage: StorageLike | null = defaultStorage(),
): OrgPriceBookRecord {
  const id = orgId.trim() || "org-local";
  if (!storage) return createOrgPriceBook(id);
  try {
    const raw = storage.getItem(ORG_PRICE_BOOK_STORAGE_KEY);
    if (!raw) return createOrgPriceBook(id);
    return clampOrgRecord(JSON.parse(raw) as Partial<OrgPriceBookRecord>, id);
  } catch {
    return createOrgPriceBook(id);
  }
}

export function persistOrgPriceBook(
  record: OrgPriceBookRecord,
  storage: StorageLike | null = defaultStorage(),
): OrgPriceBookRecord {
  const orgId = record.orgId.trim() || "org-local";
  const next = clampOrgRecord(
    {
      ...record,
      book: {
        ...record.book,
        scope: "org",
        ownerKey: orgId,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    },
    orgId,
  );
  if (storage) {
    storage.setItem(ORG_PRICE_BOOK_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearOrgPriceBook(
  storage: StorageLike | null = defaultStorage(),
): void {
  storage?.removeItem(ORG_PRICE_BOOK_STORAGE_KEY);
}

/**
 * Resolve effective book for a seat: org book + optional labour/quote overrides.
 */
export function resolveOrgPriceBookForSeat(
  record: OrgPriceBookRecord,
  seatId?: string,
): PriceBook {
  const book = clampPriceBook({ ...record.book, scope: "org" });
  if (!seatId) return book;
  const override = record.seatOverrides.find((row) => row.seatId === seatId);
  if (!override) return book;
  return clampPriceBook({
    ...book,
    labour: { ...book.labour, ...(override.labour ?? {}) },
    quoteDefaults: { ...book.quoteDefaults, ...(override.quoteDefaults ?? {}) },
  });
}

/** @deprecated Prefer readOrgPriceBook(orgId). */
export function readOrgPriceBookStub(orgId = "org-local"): OrgPriceBookRecord {
  return readOrgPriceBook(orgId, null);
}
