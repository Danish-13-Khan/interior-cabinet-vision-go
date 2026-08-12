import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { boxPrimitive, cylinderPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive, CompiledSceneNode } from "./sceneTypes";

export type LivingRoomObjectAdapter = {
  id: string;
  catalogItemId: string;
  compile: (object: InteriorObjectEntity) => CompiledPrimitive[];
};

const slot = (
  object: InteriorObjectEntity,
  name: string,
  fallback: string = LIVING_ROOM_MATERIAL_IDS.naturalOak,
) => object.materialSlots[name] ?? fallback;

function sofa(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const upholstery = slot(object, "upholstery", LIVING_ROOM_MATERIAL_IDS.oatmealFabric);
  const legs = slot(object, "legs", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const parts: CompiledPrimitive[] = [
    boxPrimitive("body", { width: w * 0.9, height: h * 0.22, depth: d * 0.76 }, { x: 0, y: h * 0.31, z: 0 }, upholstery),
    boxPrimitive("back", { width: w * 0.9, height: h * 0.56, depth: d * 0.16 }, { x: 0, y: h * 0.61, z: d * 0.34 }, upholstery, { rotationDegrees: { x: -7, y: 0, z: 0 } }),
    boxPrimitive("arm-left", { width: w * 0.09, height: h * 0.48, depth: d * 0.78 }, { x: -w * 0.455, y: h * 0.45, z: 0 }, upholstery),
    boxPrimitive("arm-right", { width: w * 0.09, height: h * 0.48, depth: d * 0.78 }, { x: w * 0.455, y: h * 0.45, z: 0 }, upholstery),
  ];
  const seats = Math.max(1, Number(object.parameters.seats) || 3);
  const seatWidth = (w * 0.78) / seats;
  for (let index = 0; index < seats; index += 1) {
    parts.push(boxPrimitive(
      `seat-${index + 1}`,
      { width: seatWidth * 0.94, height: h * 0.15, depth: d * 0.58 },
      { x: -w * 0.39 + seatWidth * (index + 0.5), y: h * 0.47, z: -d * 0.055 },
      upholstery,
    ));
  }
  for (const x of [-w * 0.38, w * 0.38]) {
    for (const z of [-d * 0.28, d * 0.28]) {
      parts.push(boxPrimitive(`leg-${x}-${z}`, { width: 55, height: h * 0.16, depth: 55 }, { x, y: h * 0.08, z }, legs));
    }
  }
  return parts;
}

function chair(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const upholstery = slot(object, "upholstery", LIVING_ROOM_MATERIAL_IDS.oliveFabric);
  const frame = slot(object, "frame");
  return [
    boxPrimitive("seat", { width: w * 0.72, height: h * 0.18, depth: d * 0.62 }, { x: 0, y: h * 0.45, z: -d * 0.04 }, upholstery),
    boxPrimitive("back", { width: w * 0.72, height: h * 0.55, depth: d * 0.14 }, { x: 0, y: h * 0.7, z: d * 0.34 }, upholstery, { rotationDegrees: { x: -8, y: 0, z: 0 } }),
    boxPrimitive("arm-left", { width: 70, height: h * 0.38, depth: d * 0.66 }, { x: -w * 0.4, y: h * 0.5, z: 0 }, frame),
    boxPrimitive("arm-right", { width: 70, height: h * 0.38, depth: d * 0.66 }, { x: w * 0.4, y: h * 0.5, z: 0 }, frame),
    boxPrimitive("leg-left", { width: 70, height: h * 0.38, depth: 70 }, { x: -w * 0.32, y: h * 0.19, z: 0 }, frame),
    boxPrimitive("leg-right", { width: 70, height: h * 0.38, depth: 70 }, { x: w * 0.32, y: h * 0.19, z: 0 }, frame),
  ];
}

function coffeeTable(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const top = slot(object, "top");
  const frame = slot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const parts: CompiledPrimitive[] = [
    boxPrimitive("top", { width: w, height: Math.max(45, h * 0.14), depth: d }, { x: 0, y: h * 0.9, z: 0 }, top),
  ];
  for (const x of [-w * 0.39, w * 0.39]) {
    for (const z of [-d * 0.34, d * 0.34]) {
      parts.push(boxPrimitive(`leg-${x}-${z}`, { width: 38, height: h * 0.82, depth: 38 }, { x, y: h * 0.41, z }, frame));
    }
  }
  return parts;
}

function sideTable(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h } = object.dimensions;
  const top = slot(object, "top", LIVING_ROOM_MATERIAL_IDS.clearGlass);
  const frame = slot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  return [
    cylinderPrimitive("top", { radiusTopMm: w / 2, heightMm: 22, radialSegments: 40 }, { x: 0, y: h - 20, z: 0 }, top),
    cylinderPrimitive("stem", { radiusTopMm: 22, heightMm: h - 45 }, { x: 0, y: (h - 45) / 2, z: 0 }, frame),
    cylinderPrimitive("base", { radiusTopMm: w * 0.34, heightMm: 24, radialSegments: 36 }, { x: 0, y: 12, z: 0 }, frame),
  ];
}

function tvUnit(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const carcass = slot(object, "carcass", LIVING_ROOM_MATERIAL_IDS.walnut);
  const fronts = slot(object, "fronts");
  const doorCount = Math.max(1, Number(object.parameters.doorCount) || 3);
  const parts: CompiledPrimitive[] = [
    boxPrimitive("carcass", { width: w, height: h * 0.82, depth: d }, { x: 0, y: h * 0.55, z: 0 }, carcass),
    boxPrimitive("plinth", { width: w * 0.9, height: h * 0.18, depth: d * 0.72 }, { x: 0, y: h * 0.09, z: 0 }, LIVING_ROOM_MATERIAL_IDS.charcoalMetal),
  ];
  const frontWidth = w / doorCount;
  for (let index = 0; index < doorCount; index += 1) {
    parts.push(boxPrimitive(
      `front-${index + 1}`,
      { width: frontWidth - 8, height: h * 0.68, depth: 22 },
      { x: -w / 2 + frontWidth * (index + 0.5), y: h * 0.55, z: -d / 2 - 12 },
      fronts,
    ));
  }
  return parts;
}

function rug(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  return [boxPrimitive("rug", { width: w, height: Math.max(10, h), depth: d }, { x: 0, y: Math.max(5, h / 2), z: 0 }, slot(object, "surface", LIVING_ROOM_MATERIAL_IDS.woolRug), { castShadow: false })];
}

function mirror(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const frame = slot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const glass = slot(object, "mirror", LIVING_ROOM_MATERIAL_IDS.clearGlass);
  const border = Math.min(45, w * 0.055);
  return [
    boxPrimitive("mirror", { width: w - border * 2, height: h - border * 2, depth: Math.max(8, d * 0.35) }, { x: 0, y: h / 2, z: 0 }, glass),
    boxPrimitive("frame-top", { width: w, height: border, depth: d }, { x: 0, y: h - border / 2, z: 0 }, frame),
    boxPrimitive("frame-bottom", { width: w, height: border, depth: d }, { x: 0, y: border / 2, z: 0 }, frame),
    boxPrimitive("frame-left", { width: border, height: h - border * 2, depth: d }, { x: -w / 2 + border / 2, y: h / 2, z: 0 }, frame),
    boxPrimitive("frame-right", { width: border, height: h - border * 2, depth: d }, { x: w / 2 - border / 2, y: h / 2, z: 0 }, frame),
  ];
}

function floorLamp(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h } = object.dimensions;
  const frame = slot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const shade = slot(object, "shade", LIVING_ROOM_MATERIAL_IDS.oatmealFabric);
  return [
    cylinderPrimitive("base", { radiusTopMm: w * 0.34, heightMm: 28, radialSegments: 32 }, { x: 0, y: 14, z: 0 }, frame),
    cylinderPrimitive("stem", { radiusTopMm: 18, heightMm: h * 0.72, radialSegments: 16 }, { x: 0, y: h * 0.38, z: 0 }, frame),
    cylinderPrimitive("shade", { radiusTopMm: w * 0.32, radiusBottomMm: w * 0.46, heightMm: h * 0.24, radialSegments: 32 }, { x: 0, y: h * 0.86, z: 0 }, shade),
  ];
}

function sectionalSofa(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const upholstery = slot(object, "upholstery", LIVING_ROOM_MATERIAL_IDS.oatmealFabric);
  const baseDepth = Math.min(d * 0.55, 900);
  const parts = sofa({
    ...object,
    dimensions: { ...object.dimensions, depthMm: baseDepth },
  });
  parts.push(
    boxPrimitive("chaise-base", { width: w * 0.34, height: h * 0.22, depth: d * 0.92 }, { x: w * 0.28, y: h * 0.31, z: -d * 0.16 }, upholstery),
    boxPrimitive("chaise-cushion", { width: w * 0.3, height: h * 0.15, depth: d * 0.78 }, { x: w * 0.28, y: h * 0.47, z: -d * 0.2 }, upholstery),
  );
  return parts;
}

function roundCoffeeTable(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h } = object.dimensions;
  const top = slot(object, "top", LIVING_ROOM_MATERIAL_IDS.walnut);
  const frame = slot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  return [
    cylinderPrimitive("top", { radiusTopMm: w / 2, heightMm: 48, radialSegments: 48 }, { x: 0, y: h - 24, z: 0 }, top),
    cylinderPrimitive("base", { radiusTopMm: w * 0.27, radiusBottomMm: w * 0.38, heightMm: h - 48, radialSegments: 40 }, { x: 0, y: (h - 48) / 2, z: 0 }, frame),
  ];
}

function bookcase(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const carcass = slot(object, "carcass");
  const panel = Math.max(24, Math.min(55, w * 0.035));
  const shelfCount = Math.max(2, Number(object.parameters.shelfCount) || 5);
  const parts: CompiledPrimitive[] = [
    boxPrimitive("side-left", { width: panel, height: h, depth: d }, { x: -w / 2 + panel / 2, y: h / 2, z: 0 }, carcass),
    boxPrimitive("side-right", { width: panel, height: h, depth: d }, { x: w / 2 - panel / 2, y: h / 2, z: 0 }, carcass),
    boxPrimitive("back", { width: w - panel * 2, height: h, depth: 18 }, { x: 0, y: h / 2, z: d / 2 - 9 }, carcass, { castShadow: false }),
  ];
  for (let index = 0; index <= shelfCount; index += 1) {
    parts.push(boxPrimitive(`shelf-${index}`, { width: w - panel * 2, height: panel, depth: d }, { x: 0, y: panel / 2 + (h - panel) * index / shelfCount, z: 0 }, carcass));
  }
  return parts;
}

function ottoman(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  return [
    boxPrimitive("base", { width: w * 0.9, height: h * 0.25, depth: d * 0.9 }, { x: 0, y: h * 0.125, z: 0 }, slot(object, "base", LIVING_ROOM_MATERIAL_IDS.walnut)),
    boxPrimitive("cushion", { width: w, height: h * 0.75, depth: d }, { x: 0, y: h * 0.625, z: 0 }, slot(object, "upholstery", LIVING_ROOM_MATERIAL_IDS.oliveFabric)),
  ];
}

function indoorPlant(object: InteriorObjectEntity) {
  const { widthMm: w, heightMm: h } = object.dimensions;
  const foliage = slot(object, "foliage", LIVING_ROOM_MATERIAL_IDS.oliveFabric);
  const planter = slot(object, "planter", LIVING_ROOM_MATERIAL_IDS.woolRug);
  return [
    cylinderPrimitive("planter", { radiusTopMm: w * 0.27, radiusBottomMm: w * 0.2, heightMm: h * 0.28, radialSegments: 32 }, { x: 0, y: h * 0.14, z: 0 }, planter),
    cylinderPrimitive("stem", { radiusTopMm: 24, heightMm: h * 0.55, radialSegments: 12 }, { x: 0, y: h * 0.47, z: 0 }, LIVING_ROOM_MATERIAL_IDS.walnut),
    cylinderPrimitive("leaf-a", { radiusTopMm: w * 0.25, radiusBottomMm: 35, heightMm: h * 0.34, radialSegments: 20 }, { x: -w * 0.14, y: h * 0.74, z: 0 }, foliage, { rotationDegrees: { x: 0, y: 0, z: 28 } }),
    cylinderPrimitive("leaf-b", { radiusTopMm: w * 0.22, radiusBottomMm: 35, heightMm: h * 0.31, radialSegments: 20 }, { x: w * 0.16, y: h * 0.77, z: 0 }, foliage, { rotationDegrees: { x: 0, y: 0, z: -32 } }),
    cylinderPrimitive("leaf-c", { radiusTopMm: w * 0.23, radiusBottomMm: 30, heightMm: h * 0.32, radialSegments: 20 }, { x: 0, y: h * 0.84, z: 0 }, foliage),
  ];
}

const ADAPTERS: readonly LivingRoomObjectAdapter[] = [
  { id: "sofa-v1", catalogItemId: "living:sofa-3-seat", compile: sofa },
  { id: "chair-v1", catalogItemId: "living:lounge-chair", compile: chair },
  { id: "coffee-table-v1", catalogItemId: "living:coffee-table", compile: coffeeTable },
  { id: "side-table-v1", catalogItemId: "living:side-table", compile: sideTable },
  { id: "tv-unit-v1", catalogItemId: "living:tv-unit", compile: tvUnit },
  { id: "rug-v1", catalogItemId: "living:area-rug", compile: rug },
  { id: "mirror-v1", catalogItemId: "living:wall-mirror", compile: mirror },
  { id: "floor-lamp-v1", catalogItemId: "living:floor-lamp", compile: floorLamp },
  { id: "sectional-sofa-v1", catalogItemId: "living:sofa-sectional", compile: sectionalSofa },
  { id: "loveseat-v1", catalogItemId: "living:sofa-loveseat", compile: sofa },
  { id: "accent-chair-v1", catalogItemId: "living:accent-chair", compile: chair },
  { id: "round-coffee-table-v1", catalogItemId: "living:coffee-table-round", compile: roundCoffeeTable },
  { id: "console-table-v1", catalogItemId: "living:console-table", compile: coffeeTable },
  { id: "bookcase-v1", catalogItemId: "living:bookcase", compile: bookcase },
  { id: "ottoman-v1", catalogItemId: "living:ottoman", compile: ottoman },
  { id: "indoor-plant-v1", catalogItemId: "living:indoor-plant", compile: indoorPlant },
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
  return {
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
  };
}
