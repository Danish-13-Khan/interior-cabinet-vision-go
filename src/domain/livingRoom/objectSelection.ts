import type { InteriorObjectEntity } from "../interiorProject";

export function selectableObjectIds(
  objects: readonly InteriorObjectEntity[],
  roomId?: string,
): string[] {
  return objects
    .filter((object) => !roomId || object.roomId === roomId)
    .map((object) => object.id);
}

export function nextSelectableObjectId(
  objects: readonly InteriorObjectEntity[],
  currentId: string | null,
  delta: 1 | -1,
  roomId?: string,
): string | null {
  const ids = selectableObjectIds(objects, roomId);
  if (ids.length === 0) return null;
  const index = currentId ? ids.indexOf(currentId) : -1;
  if (index < 0) return ids[0] ?? null;
  return ids[(index + delta + ids.length) % ids.length] ?? null;
}
