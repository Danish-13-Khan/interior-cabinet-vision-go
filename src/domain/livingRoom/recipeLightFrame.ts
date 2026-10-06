import type { InteriorProject, LightEntity } from "../interiorProject";
import { frameIsOrigin, roomFrame } from "../interiorProject/roomFrame";
import { LIVING_ROOM_LIGHTING_RECIPES } from "./lighting";

/** Seed positions were drawn for the 6200 × 4600 living-room starter. */
const SEED_ROOM_WIDTH_MM = 6200;
const SEED_ROOM_DEPTH_MM = 4600;
const INSIDE_MARGIN_MM = 50;

/** Local lights (point / spot / area) whose output is shared over the room's floor area. */
const LOCAL_RECIPE_KINDS = new Set(["point", "spot", "area"]);

/**
 * Same recipe light in a smaller room lights it harder, so local lights are
 * scaled by floor area (never brightened). The sun and ambient fill do not
 * depend on room size.
 */
export function recipeLightAreaScale(kind: string, widthMm: number, depthMm: number): number {
  if (!LOCAL_RECIPE_KINDS.has(kind)) return 1;
  const ratio = (widthMm * depthMm) / (SEED_ROOM_WIDTH_MM * SEED_ROOM_DEPTH_MM);
  return Math.min(1, Math.max(0, ratio));
}

function fitToRoom(seed: number, spanMm: number, referenceMm: number) {
  const scaled = seed * (spanMm / referenceMm);
  const limit = Math.max(0, spanMm / 2 - INSIDE_MARGIN_MM);
  return Math.min(limit, Math.max(-limit, scaled));
}

/**
 * Recipe seeds are offsets from a room centred on the origin. Off-centre rooms
 * get those offsets scaled to the room and parked inside it, and local lights
 * dimmed by floor area so a small room is not overlit. A room already on
 * the origin is returned unchanged so single-room scenes stay byte-identical.
 *
 * Preset fill is only on the room that owns the recipe light (the hero room).
 * Other rooms have fixtures and no preset fill. Phase 8.2 overview lighting
 * must not assume every room carries this rig.
 */
export function placeRecipeLight(project: InteriorProject, light: LightEntity): LightEntity {
  if (typeof light.parameters.recipeId !== "string") return light;
  const roomId = light.roomId ?? project.activeRoomId;
  if (!roomId) return light;
  const frame = roomFrame(project, roomId);
  if (frameIsOrigin(frame)) return light;
  const recipe = LIVING_ROOM_LIGHTING_RECIPES.find((item) => item.id === light.parameters.recipeId);
  const seed = recipe?.lights.find((item) => item.name === light.name && item.kind === light.kind);
  if (!seed) return light;
  const placed: LightEntity = {
    ...light,
    intensity: light.intensity * recipeLightAreaScale(light.kind, frame.widthMm, frame.depthMm),
    position: {
      x: frame.centre.x + fitToRoom(seed.position.x, frame.widthMm, SEED_ROOM_WIDTH_MM),
      y: seed.position.y,
      z: frame.centre.z + fitToRoom(seed.position.z, frame.depthMm, SEED_ROOM_DEPTH_MM),
    },
  };
  if (light.kind !== "directional") return placed;
  return {
    ...placed,
    parameters: {
      ...placed.parameters,
      targetXMm: frame.centre.x,
      targetZMm: frame.centre.z,
    },
  };
}
