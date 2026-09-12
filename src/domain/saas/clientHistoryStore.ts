import { defaultStorage, type StorageLike } from "./accountTypes";
import {
  createClientHistoryRecord,
  type ClientHistoryRecord,
} from "./clientHistory";

export const CLIENT_HISTORY_STORAGE_KEY = "cabinet-studio-client-history-v1";

export function readClientHistory(
  storage: StorageLike | null = defaultStorage(),
): ClientHistoryRecord[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(CLIENT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => createClientHistoryRecord(item as Partial<ClientHistoryRecord>));
  } catch {
    return [];
  }
}

export function persistClientHistory(
  clients: ClientHistoryRecord[],
  storage: StorageLike | null = defaultStorage(),
): ClientHistoryRecord[] {
  const next = clients.map((c) => createClientHistoryRecord(c));
  if (storage) {
    storage.setItem(CLIENT_HISTORY_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function upsertClientHistory(
  client: ClientHistoryRecord,
  storage: StorageLike | null = defaultStorage(),
): ClientHistoryRecord[] {
  const list = readClientHistory(storage);
  const idx = list.findIndex((c) => c.id === client.id);
  const nextRecord = createClientHistoryRecord({
    ...client,
    updatedAt: new Date().toISOString(),
  });
  if (idx >= 0) list[idx] = nextRecord;
  else list.push(nextRecord);
  return persistClientHistory(list, storage);
}
