import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive, cylinderPrimitive, roundedBoxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

/** Low TV unit — procedural millwork silhouette (not interactive doors). */
export function compileTvUnit(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const carcass = materialSlot(object, "carcass", LIVING_ROOM_MATERIAL_IDS.walnut);
  const fronts = materialSlot(object, "fronts", LIVING_ROOM_MATERIAL_IDS.naturalOak);
  const metal = LIVING_ROOM_MATERIAL_IDS.charcoalMetal;
  const doorCount = Math.max(1, Number(object.parameters.doorCount) || 3);
  const floating = object.parameters.floating === true;
  const mountH = floating ? Math.max(120, Number(object.parameters.mountHeightMm) || 320) : 0;
  const plinthH = floating ? 0 : Math.max(60, h * 0.12);
  const topH = Math.max(28, h * 0.055);
  const bodyH = Math.max(120, h - plinthH - topH);
  const bodyY = mountH + plinthH + bodyH / 2;
  const topY = mountH + plinthH + bodyH + topH / 2;
  const panelT = 22;
  const frontInset = 10;
  const gap = 6;
  const parts: CompiledPrimitive[] = [
    ...(floating ? [] : [boxPrimitive(
      "plinth",
      { width: w * 0.94, height: plinthH, depth: d * 0.88 },
      { x: 0, y: plinthH / 2, z: 8 },
      metal,
    )]),
    boxPrimitive(
      "carcass",
      { width: w, height: bodyH, depth: d },
      { x: 0, y: bodyY, z: 0 },
      carcass,
    ),
    boxPrimitive(
      "top",
      { width: w + 8, height: topH, depth: d + 12 },
      { x: 0, y: topY, z: -2 },
      carcass,
    ),
    boxPrimitive(
      "back-rail",
      { width: w - 16, height: bodyH * 0.92, depth: 12 },
      { x: 0, y: bodyY, z: -d / 2 + 10 },
      carcass,
      { castShadow: false },
    ),
  ];

  const bayW = w / doorCount;
  const doorW = bayW - gap;
  const doorH = bodyH - 28;
  for (let index = 0; index < doorCount; index += 1) {
    const x = -w / 2 + bayW * (index + 0.5);
    parts.push(boxPrimitive(
      `front-${index + 1}`,
      { width: doorW, height: doorH, depth: panelT },
      { x, y: bodyY, z: d / 2 + frontInset },
      fronts,
    ));
    parts.push(cylinderPrimitive(
      `handle-${index + 1}`,
      { radiusTopMm: 5, radiusBottomMm: 5, heightMm: Math.min(72, doorH * 0.22), radialSegments: 10 },
      { x: x + doorW * 0.28, y: bodyY, z: d / 2 + frontInset + panelT / 2 + 6 },
      metal,
    ));
  }

  const tvW = w * 0.72;
  const tvH = h * 1.35;
  const tvY = mountH + h + tvH * 0.42;
  parts.push(
    roundedBoxPrimitive(
      "television",
      { width: tvW, height: tvH, depth: 36 },
      { x: 0, y: tvY, z: d * 0.12 },
      metal,
      { radiusMm: 14, smoothness: 4 },
    ),
    roundedBoxPrimitive(
      "screen",
      { width: tvW * 0.94, height: tvH * 0.9, depth: 6 },
      { x: 0, y: tvY, z: d * 0.12 - 16 },
      LIVING_ROOM_MATERIAL_IDS.clearGlass,
      { radiusMm: 8, smoothness: 4, castShadow: false },
    ),
  );
  return parts;
}

export function compileRug(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  return [boxPrimitive(
    "rug",
    { width: w, height: Math.max(10, h), depth: d },
    { x: 0, y: Math.max(5, h / 2), z: 0 },
    materialSlot(object, "surface", LIVING_ROOM_MATERIAL_IDS.woolRug),
    { castShadow: false },
  )];
}

export function compileMirror(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const frame = materialSlot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const glass = materialSlot(object, "mirror", LIVING_ROOM_MATERIAL_IDS.clearGlass);
  const border = Math.min(45, w * 0.055);
  return [
    boxPrimitive("mirror", { width: w - border * 2, height: h - border * 2, depth: Math.max(8, d * 0.35) }, { x: 0, y: h / 2, z: 0 }, glass),
    boxPrimitive("frame-top", { width: w, height: border, depth: d }, { x: 0, y: h - border / 2, z: 0 }, frame),
    boxPrimitive("frame-bottom", { width: w, height: border, depth: d }, { x: 0, y: border / 2, z: 0 }, frame),
    boxPrimitive("frame-left", { width: border, height: h - border * 2, depth: d }, { x: -w / 2 + border / 2, y: h / 2, z: 0 }, frame),
    boxPrimitive("frame-right", { width: border, height: h - border * 2, depth: d }, { x: w / 2 - border / 2, y: h / 2, z: 0 }, frame),
  ];
}

/** Open bookcase — procedural storage silhouette with toe kick and shelf rhythm. */
export function compileBookcase(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const carcass = materialSlot(object, "carcass", LIVING_ROOM_MATERIAL_IDS.naturalOak);
  const panel = Math.max(22, Math.min(48, w * 0.032));
  const toeH = Math.max(50, h * 0.035);
  const shelfCount = Math.max(2, Number(object.parameters.shelfCount) || 5);
  const innerW = w - panel * 2;
  const innerH = h - toeH - panel;
  const parts: CompiledPrimitive[] = [
    boxPrimitive(
      "toe-kick",
      { width: w * 0.92, height: toeH, depth: d * 0.82 },
      { x: 0, y: toeH / 2, z: 6 },
      LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    ),
    boxPrimitive("side-left", { width: panel, height: h - toeH, depth: d }, { x: -w / 2 + panel / 2, y: toeH + (h - toeH) / 2, z: 0 }, carcass),
    boxPrimitive("side-right", { width: panel, height: h - toeH, depth: d }, { x: w / 2 - panel / 2, y: toeH + (h - toeH) / 2, z: 0 }, carcass),
    boxPrimitive("top", { width: w, height: panel, depth: d }, { x: 0, y: h - panel / 2, z: 0 }, carcass),
    boxPrimitive(
      "back",
      { width: innerW, height: innerH, depth: 14 },
      { x: 0, y: toeH + panel / 2 + innerH / 2, z: d / 2 - 9 },
      carcass,
      { castShadow: false },
    ),
  ];
  for (let index = 0; index <= shelfCount; index += 1) {
    const y = toeH + panel / 2 + (innerH - panel) * (index / shelfCount);
    parts.push(boxPrimitive(
      `shelf-${index}`,
      { width: innerW, height: panel * 0.85, depth: d - 8 },
      { x: 0, y, z: -2 },
      carcass,
    ));
  }
  return parts;
}
