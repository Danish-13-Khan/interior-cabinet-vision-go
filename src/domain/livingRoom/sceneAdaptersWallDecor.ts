import type { InteriorObjectEntity } from "../interiorProject";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

const countOf = (object: InteriorObjectEntity, key: string, fallback: number) => {
  const value = Number(object.parameters[key]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
};

/** Plain face with grooves along height (vertical) or width (horizontal). */
export function compileGroovedPanel(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const face = materialSlot(object, "face");
  const groove = materialSlot(object, "groove", face);
  const horizontal = object.parameters.orientation === "horizontal";
  const back = Math.max(8, d * 0.6);
  const proud = Math.max(3, d - back);
  const parts: CompiledPrimitive[] = [
    boxPrimitive("face", { width: w, height: h, depth: back }, { x: 0, y: h / 2, z: -proud / 2 }, face),
  ];
  const span = horizontal ? h : w;
  const grooves = Math.max(2, Math.min(24, Math.floor(span / 90)));
  const step = span / grooves;
  const grooveSize = Math.max(4, step * 0.18);
  for (let index = 0; index < grooves; index += 1) {
    const at = -span / 2 + step * (index + 0.5);
    parts.push(boxPrimitive(
      `groove-${index + 1}`,
      horizontal
        ? { width: w * 0.92, height: grooveSize, depth: proud }
        : { width: grooveSize, height: h * 0.92, depth: proud },
      { x: horizontal ? 0 : at, y: horizontal ? h / 2 + at : h / 2, z: back / 2 },
      groove,
    ));
  }
  return parts;
}

/** Rails, stiles, and recessed fields. Field count comes from parameters.fieldCount. */
export function compileWainscot(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const frame = materialSlot(object, "frame");
  const fieldMat = materialSlot(object, "field", frame);
  const fields = Math.max(1, Math.min(6, countOf(object, "fieldCount", 3)));
  const rail = Math.max(28, Math.min(56, h * 0.08));
  const stile = Math.max(28, Math.min(56, w * 0.08));
  const recess = Math.max(6, d * 0.4);
  const innerH = Math.max(20, h - rail * 2);
  const innerW = Math.max(20, w - stile * 2);
  const parts: CompiledPrimitive[] = [
    boxPrimitive("rail-bottom", { width: w, height: rail, depth: d }, { x: 0, y: rail / 2, z: 0 }, frame),
    boxPrimitive("rail-top", { width: w, height: rail, depth: d }, { x: 0, y: h - rail / 2, z: 0 }, frame),
    boxPrimitive("stile-left", { width: stile, height: innerH, depth: d }, { x: -w / 2 + stile / 2, y: h / 2, z: 0 }, frame),
    boxPrimitive("stile-right", { width: stile, height: innerH, depth: d }, { x: w / 2 - stile / 2, y: h / 2, z: 0 }, frame),
  ];
  const fieldW = innerW / fields;
  for (let index = 0; index < fields; index += 1) {
    const x = -innerW / 2 + fieldW * (index + 0.5);
    if (index > 0) {
      parts.push(boxPrimitive(
        `muntin-${index}`,
        { width: Math.min(stile, fieldW * 0.2), height: innerH, depth: d },
        { x: -innerW / 2 + fieldW * index, y: h / 2, z: 0 },
        frame,
      ));
    }
    parts.push(boxPrimitive(
      `field-${index + 1}`,
      { width: fieldW * 0.82, height: innerH * 0.86, depth: recess },
      { x, y: h / 2, z: -(d - recess) / 2 },
      fieldMat,
    ));
  }
  return parts;
}

/** Two or three boxes stepping in depth along a chair rail. */
export function compileMouldingStrip(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const face = materialSlot(object, "face");
  const band = h / 3;
  return [0.55, 1, 0.72].map((scale, index) => boxPrimitive(
    `step-${index + 1}`,
    { width: w, height: band, depth: d * scale },
    { x: 0, y: band * (index + 0.5), z: (d * scale - d) / 2 },
    face,
  ));
}

/** Narrow vertical strip with a proud bead. */
export function compileProfileStrip(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const face = materialSlot(object, "face");
  const bead = Math.max(4, w * 0.35);
  return [
    boxPrimitive("strip", { width: w, height: h, depth: d * 0.7 }, { x: 0, y: h / 2, z: -d * 0.15 }, face),
    boxPrimitive("bead", { width: bead, height: h, depth: d * 0.45 }, { x: 0, y: h / 2, z: d * 0.25 }, face),
  ];
}
