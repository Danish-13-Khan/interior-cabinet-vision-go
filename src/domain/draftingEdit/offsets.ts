import type { DraftingDimOffset, DraftingTagOffset } from "./types";

const MAX_OFFSET = 120;

export function clampOffsetValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, Math.round(value * 10) / 10));
}

export function clampDimOffset(offset: DraftingDimOffset): DraftingDimOffset {
  return {
    id: String(offset.id || "dim"),
    dx: clampOffsetValue(offset.dx),
    dy: clampOffsetValue(offset.dy),
  };
}

export function clampTagOffset(offset: DraftingTagOffset): DraftingTagOffset {
  return {
    cabinetId: String(offset.cabinetId || ""),
    dx: clampOffsetValue(offset.dx),
    dy: clampOffsetValue(offset.dy),
  };
}

export function getDimOffset(
  offsets: DraftingDimOffset[] | undefined,
  id: string,
): { dx: number; dy: number } {
  const found = offsets?.find((item) => item.id === id);
  return { dx: found?.dx ?? 0, dy: found?.dy ?? 0 };
}

export function upsertDimOffset(
  offsets: DraftingDimOffset[] | undefined,
  next: DraftingDimOffset,
): DraftingDimOffset[] {
  const safe = clampDimOffset(next);
  const list = [...(offsets ?? [])].filter((item) => item.id !== safe.id);
  if (safe.dx === 0 && safe.dy === 0) return list;
  list.push(safe);
  return list.slice(0, 80);
}

export function getTagOffset(
  offsets: DraftingTagOffset[] | undefined,
  cabinetId: string,
): { dx: number; dy: number } {
  const found = offsets?.find((item) => item.cabinetId === cabinetId);
  return { dx: found?.dx ?? 0, dy: found?.dy ?? 0 };
}

export function upsertTagOffset(
  offsets: DraftingTagOffset[] | undefined,
  next: DraftingTagOffset,
): DraftingTagOffset[] {
  const safe = clampTagOffset(next);
  if (!safe.cabinetId) return offsets ?? [];
  const list = [...(offsets ?? [])].filter(
    (item) => item.cabinetId !== safe.cabinetId,
  );
  if (safe.dx === 0 && safe.dy === 0) return list;
  list.push(safe);
  return list.slice(0, 80);
}

export function removeDimOffset(
  offsets: DraftingDimOffset[] | undefined,
  id: string,
) {
  return (offsets ?? []).filter((item) => item.id !== id);
}

export function removeTagOffset(
  offsets: DraftingTagOffset[] | undefined,
  cabinetId: string,
) {
  return (offsets ?? []).filter((item) => item.cabinetId !== cabinetId);
}
