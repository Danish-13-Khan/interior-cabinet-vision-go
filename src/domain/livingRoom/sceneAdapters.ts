import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { attachObjectRenderBinding } from "./renderAssetBindings";
import type { LivingRoomObjectAdapter } from "./sceneAdapterTypes";
import {
  compileChair,
  compileOttoman,
  compileSectionalSofa,
  compileSofa,
} from "./sceneAdaptersSeating";
import {
  compileBookcase,
  compileMirror,
  compileRug,
  compileTvUnit,
} from "./sceneAdaptersMillwork";
import { compileFlutedFeatureWall } from "./sceneAdaptersFeatureWalls";
import {
  compileCoffeeTable,
  compileFloorLamp,
  compileIndoorPlant,
  compileRoundCoffeeTable,
  compileSideTable,
} from "./sceneAdaptersTables";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledSceneNode } from "./sceneTypes";

export type { LivingRoomObjectAdapter } from "./sceneAdapterTypes";

const ADAPTERS: readonly LivingRoomObjectAdapter[] = [
  { id: "sofa-v1", catalogItemId: "living:sofa-3-seat", compile: compileSofa },
  { id: "chair-v1", catalogItemId: "living:lounge-chair", compile: compileChair },
  { id: "coffee-table-v1", catalogItemId: "living:coffee-table", compile: compileCoffeeTable },
  { id: "side-table-v1", catalogItemId: "living:side-table", compile: compileSideTable },
  { id: "tv-unit-v1", catalogItemId: "living:tv-unit", compile: compileTvUnit },
  { id: "fluted-feature-wall-v1", catalogItemId: "living:feature-wall-fluted", compile: compileFlutedFeatureWall },
  { id: "rug-v1", catalogItemId: "living:area-rug", compile: compileRug },
  { id: "mirror-v1", catalogItemId: "living:wall-mirror", compile: compileMirror },
  { id: "floor-lamp-v1", catalogItemId: "living:floor-lamp", compile: compileFloorLamp },
  { id: "sectional-sofa-v1", catalogItemId: "living:sofa-sectional", compile: compileSectionalSofa },
  { id: "loveseat-v1", catalogItemId: "living:sofa-loveseat", compile: compileSofa },
  { id: "accent-chair-v1", catalogItemId: "living:accent-chair", compile: compileChair },
  { id: "round-coffee-table-v1", catalogItemId: "living:coffee-table-round", compile: compileRoundCoffeeTable },
  { id: "console-table-v1", catalogItemId: "living:console-table", compile: compileCoffeeTable },
  { id: "bookcase-v1", catalogItemId: "living:bookcase", compile: compileBookcase },
  { id: "ottoman-v1", catalogItemId: "living:ottoman", compile: compileOttoman },
  { id: "indoor-plant-v1", catalogItemId: "living:indoor-plant", compile: compileIndoorPlant },
];

const ADAPTER_BY_CATALOG_ID = new Map(
  ADAPTERS.map((adapter) => [adapter.catalogItemId, adapter]),
);

export function getLivingRoomObjectAdapter(catalogItemId: string) {
  return ADAPTER_BY_CATALOG_ID.get(catalogItemId) ?? null;
}

export function compileLivingRoomObjectNode(
  object: InteriorObjectEntity,
): CompiledSceneNode {
  const adapter = getLivingRoomObjectAdapter(object.catalogItemId);
  const materialId = Object.values(object.materialSlots)[0] ?? LIVING_ROOM_MATERIAL_IDS.naturalOak;
  const primitives = adapter?.compile(object) ?? [
    boxPrimitive(
      "placeholder",
      {
        width: object.dimensions.widthMm,
        height: object.dimensions.heightMm,
        depth: object.dimensions.depthMm,
      },
      { x: 0, y: object.dimensions.heightMm / 2, z: 0 },
      materialId,
    ),
  ];
  return attachObjectRenderBinding({
    id: `object-node:${object.id}`,
    name: object.name,
    sourceObjectId: object.id,
    adapterId: adapter?.id ?? "safe-placeholder-v1",
    positionMm: { ...object.position },
    rotationDegrees: { ...object.rotation },
    primitives,
    placeholder: !adapter,
    metadata: {
      category: object.category,
      catalogItemId: object.catalogItemId,
    },
    renderBinding: { strategy: "procedural", materialBindings: {} },
  }, object);
}
