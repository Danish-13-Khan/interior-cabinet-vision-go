import type { CabinetType } from "../cabinetCapabilities";
import { persistCabinetIdentityOnObject } from "../cabinetIdentity";
import type { CabinetFamilyId } from "../cabinetIdentity/types";
import type {
  InteriorObjectEntity,
  InteriorObjectKind,
  ParameterValue,
  Point3Mm,
  Size3Mm,
} from "../interiorProject";
import { LIVING_ROOM_CATALOG_ITEMS } from "./catalogItems";
import { assertV1CatalogScope } from "./v1Scope";

export type LivingRoomCatalogItem = {
  id: string;
  name: string;
  kind: InteriorObjectKind;
  category: string;
  cabinetType?: CabinetType;
  familyId?: CabinetFamilyId;
  dimensions: Size3Mm;
  materialSlots: Record<string, string>;
  parameters: Record<string, ParameterValue>;
  placement: "floor" | "wall";
};

export type LivingRoomObjectPlacement = {
  id: string;
  roomId: string;
  position: Point3Mm;
  rotationY?: number;
};

export const LIVING_ROOM_CATALOG = LIVING_ROOM_CATALOG_ITEMS;

assertV1CatalogScope(LIVING_ROOM_CATALOG.length);

export type LivingRoomCatalogId = (typeof LIVING_ROOM_CATALOG)[number]["id"];

export function getLivingRoomCatalogItem(id: LivingRoomCatalogId) {
  const item = LIVING_ROOM_CATALOG.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown living-room catalog item: ${id}`);
  return item;
}

export function createLivingRoomObject(
  catalogItemId: LivingRoomCatalogId,
  placement: LivingRoomObjectPlacement,
): InteriorObjectEntity {
  const item = getLivingRoomCatalogItem(catalogItemId);
  return persistCabinetIdentityOnObject({
    id: placement.id,
    roomId: placement.roomId,
    kind: item.kind,
    category: item.category,
    catalogItemId: item.id,
    name: item.name,
    position: { ...placement.position },
    rotation: { x: 0, y: placement.rotationY ?? 0, z: 0 },
    dimensions: { ...item.dimensions },
    materialSlots: { ...item.materialSlots },
    parameters: { ...item.parameters },
    extensions: { placement: item.placement },
  });
}
