import type { InteriorProject, LightEntity } from "../interiorProject";
import { frameIsOrigin, roomFrame } from "../interiorProject/roomFrame";
import { LIVING_ROOM_LIGHTING_RECIPES } from "./lighting";

/** Seed positions were drawn for the 6200 × 4600 living-room starter. */
const SEED_ROOM_WIDTH_MM = 6200;
const SEED_ROOM_DEPTH_MM = 4600;
const INSIDE_MARGIN_MM = 50;

function fitToRoom(seed: number, spanMm: number, referenceMm: number) {
  const scaled = seed * (spanMm / referenceMm);
  const limit = Math.max(0, spanMm / 2 - INSIDE_MARGIN_MM);
  return Math.min(limit, Math.max(-limit, scaled));
}

/**
 * Recipe seeds are offsets from a room centred on the origin. Off-centre rooms
 * get those offsets scaled to the room and parked inside it. A room already on
 * the origin is returned unchanged so single-room scenes stay byte-identical.
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
