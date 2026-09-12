/**
 * localStorage read / write / clear for SaaS account snapshot.
 */

import { clampLocalAccount } from "./accountModel";
import {
  ACCOUNT_STORAGE_KEY,
  defaultStorage,
  type LocalAccountSnapshot,
  type StorageLike,
} from "./accountTypes";

export function readLocalAccount(
  storage: StorageLike | null = defaultStorage(),
): LocalAccountSnapshot | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    return clampLocalAccount(JSON.parse(raw) as LocalAccountSnapshot);
  } catch {
    return null;
  }
}

export function persistLocalAccount(
  account: LocalAccountSnapshot,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  storage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
}

export function clearLocalAccount(
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  storage.removeItem(ACCOUNT_STORAGE_KEY);
}
