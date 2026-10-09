import type { LightEntity } from "../../interiorProject";
import { LIGHT_RENDER_SCALE } from "../lightFixtureTypes";
import { area, at, box, cylinder, type FixtureSize } from "./cyclesPartHelpers";
import type { CyclesFixtureLight, CyclesFixturePart } from "./types";

const STRIP_HALO_STANDOFF_M = 0.06;

type Built = { parts: CyclesFixturePart[]; lights: CyclesFixtureLight[] };

/** Cove, rope / profile / under-cabinet strips and the panel, mirroring the viewport fixtures. Null for other kinds. */
export function stripFixtureParts(
  light: LightEntity,
  kind: string,
  size: FixtureSize,
  glowColor: string,
  glow: { color: string; strength: number },
  emits: boolean,
  cast: boolean,
): Built | null {
  const parts: CyclesFixturePart[] = [];
  const lights: CyclesFixtureLight[] = [];
  if (kind === "cove") {
    const board = size.across;
    const emitZ = -(board / 2 + 0.006);
    parts.push(box([size.length, size.depth, board], at(0, 0, 0), size.body, 0.25, 0.48));
    parts.push(box([size.length * 0.92, size.depth * 0.55, 0.004], at(0, 0, emitZ), glowColor, 0, 0.35, glow));
    if (emits) {
      lights.push(area(`${light.id}:up`, "emitter", at(0, 0, emitZ - 0.004), { width: size.length, height: size.depth }, light, size.intensity, cast));
      lights.push(area(
        `${light.id}:wall`,
        "wall-band",
        at(0, -size.depth * 0.2, emitZ, [90, 0, 0]),
        { width: size.length, height: size.depth },
        light,
        size.intensity * LIGHT_RENDER_SCALE.coveWallShare,
        cast,
      ));
    }
    return { parts, lights };
  }

  if (kind === "rope" || kind === "profile" || kind === "under-cabinet") {
    const vertical = kind === "profile" && light.parameters.orientation === "vertical";
    const rope = kind === "rope";
    const span: [number, number, number] = vertical
      ? [size.across, size.length, size.depth]
      : [size.length, size.across, size.depth];
    const front = rope ? Math.min(size.across, size.depth) / 2 : size.depth / 2;
    const onWall = typeof light.parameters.hostWallId === "string" && light.parameters.hostWallId !== "";
    if (rope) {
      parts.push(cylinder("cylinder", { radiusTop: front, radiusBottom: front, height: size.length, segments: 20 }, at(0, 0, 0, [0, 0, 90]), size.body, 0, 0.45));
    } else {
      parts.push(box(span, at(0, 0, 0), size.body, size.metal, 0.38));
    }
    parts.push(box([span[0] * 0.86, Math.max(span[1] * 0.62, 0.004), 0.003], at(0, 0, -(front + 0.001)), glowColor, 0, 0.32, glow));
    if (emits) {
      const sizeM = { width: span[0], height: Math.max(span[1], 0.01) };
      lights.push(area(`${light.id}:emit`, "emitter", at(0, 0, -(front + 0.006)), sizeM, light, size.intensity, cast));
      if (onWall) {
        lights.push(area(
          `${light.id}:halo`,
          "halo",
          at(0, 0, -(front + STRIP_HALO_STANDOFF_M), [0, 180, 0]),
          sizeM,
          light,
          size.intensity * LIGHT_RENDER_SCALE.stripHaloShare,
          cast,
        ));
      }
    }
    return { parts, lights };
  }

  if (kind === "panel") {
    parts.push(box([size.length, size.across, size.depth], at(0, 0, 0), size.body, 0.12, 0.46));
    parts.push(box([size.length * 0.94, size.across * 0.94, 0.004], at(0, 0, -(size.depth / 2 + 0.001)), glowColor, 0, 0.3, glow));
    if (emits) {
      lights.push(area(`${light.id}:emit`, "emitter", at(0, 0, -(size.depth / 2 + 0.008)), { width: size.length, height: size.across }, light, size.intensity, cast));
    }
    return { parts, lights };
  }

  return null;
}
