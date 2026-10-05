import type { InteriorProject, LightEntity } from "../../domain/interiorProject";
import { isRoomLightFixture } from "../../domain/livingRoom/roomLightFixtures";
import { resolveLightAttachment } from "../../domain/livingRoom/lightAttachments";

export type PlanLightGlyph =
  | { shape: "line"; x1: number; z1: number; x2: number; z2: number }
  | { shape: "rect"; points: string }
  | { shape: "circle"; cx: number; cz: number; r: number };

const CIRCLE_R_MM = 90;

function axes(yawDeg: number) {
  const yaw = (yawDeg * Math.PI) / 180;
  return { ux: Math.cos(yaw), uz: -Math.sin(yaw), vx: Math.sin(yaw), vz: Math.cos(yaw) };
}

function num(light: LightEntity, key: string, fallback: number) {
  const value = light.parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Plan glyph. Local +X is `(cos yaw, −sin yaw)` in plan x/z. */
export function planLightGlyph(light: LightEntity): PlanLightGlyph {
  const { x, z } = light.position;
  const { ux, uz, vx, vz } = axes(light.rotation.y);
  if (light.parameters.fixtureKind === "panel") {
    const hw = num(light, "widthMm", 600) / 2;
    const hd = num(light, "heightMm", 600) / 2;
    const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([along, across]) =>
      `${x + ux * along + vx * across},${z + uz * along + vz * across}`);
    return { shape: "rect", points: corners.join(" ") };
  }
  if (light.kind === "area") {
    const half = num(light, "widthMm", 1000) / 2;
    return { shape: "line", x1: x - ux * half, z1: z - uz * half, x2: x + ux * half, z2: z + uz * half };
  }
  return { shape: "circle", cx: x, cz: z, r: CIRCLE_R_MM };
}

/** Active-room fixtures only. Other rooms cannot be selected from this plan. */
export function planLightsForRoom(project: InteriorProject): LightEntity[] {
  return project.lights
    .filter((light) => light.roomId === project.activeRoomId && isRoomLightFixture(light))
    .map((light) => resolveLightAttachment(project, light));
}
