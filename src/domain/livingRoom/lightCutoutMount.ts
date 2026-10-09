import {
  ceilingCutoutSizeMm, readCeilingCutouts, setCeilingCutoutPolygon,
  type InteriorProject, type LightEntity, type Point2Mm,
} from "../interiorProject";
import { fixtureNumber } from "./lightFixtureProperties";

/** Air gap between a fixture and the cutout rim, each side. */
export const CUTOUT_CLEARANCE_MM = 10;

/**
 * Drop that leaves the fixture flush with the slab underside: a panel sits
 * half in the hole (its face at the ceiling plane), a recessed spot shows only
 * its face.
 */
export function flushCeilingDropMm(light: LightEntity): number {
  if (light.parameters.fixtureKind === "panel") return Math.round(fixtureNumber(light, "depthMm", 30) / 2);
  return 0;
}

/** Cutout a fixture needs: its footprint plus clearance; round fixtures get a square. */
export function cutoutSizeForLight(light: LightEntity): { widthMm: number; depthMm: number } {
  const kind = light.parameters.fixtureKind;
  const along = fixtureNumber(light, "widthMm", 90);
  const across = fixtureNumber(light, "heightMm", 90);
  if (kind === "cob" || kind === "ceiling-downlight" || kind === "pendant") {
    const diameter = Math.max(along, across) + CUTOUT_CLEARANCE_MM;
    return { widthMm: diameter, depthMm: diameter };
  }
  const yawed = Math.abs((((light.rotation.y % 180) + 180) % 180) - 90) < 1;
  return yawed
    ? { widthMm: across + CUTOUT_CLEARANCE_MM, depthMm: along + CUTOUT_CLEARANCE_MM }
    : { widthMm: along + CUTOUT_CLEARANCE_MM, depthMm: across + CUTOUT_CLEARANCE_MM };
}

/** Lights of the active room centred in this cutout. */
export function lightsInCutout(project: InteriorProject, cutoutId: string): LightEntity[] {
  return project.lights.filter((light) =>
    light.roomId === project.activeRoomId
    && light.parameters.hostSurface === "ceiling"
    && light.parameters.hostCutoutId === cutoutId);
}

/** Resize a cutout around its centre to the fixture's footprint; refused when the new rim would not fit the room. */
export function fitCeilingCutoutToLight(project: InteriorProject, cutoutId: string, lightId: string): InteriorProject {
  const roomId = project.activeRoomId;
  const room = project.rooms.find((item) => item.id === roomId);
  const light = project.lights.find((item) => item.id === lightId && item.roomId === roomId);
  const cutout = readCeilingCutouts(room).find((item) => item.id === cutoutId);
  if (!room || !light || !cutout) return project;
  const size = cutoutSizeForLight(light);
  const { centerX, centerZ } = ceilingCutoutSizeMm(cutout);
  const hw = size.widthMm / 2;
  const hd = size.depthMm / 2;
  const polygon: Point2Mm[] = [
    { x: centerX - hw, z: centerZ - hd }, { x: centerX + hw, z: centerZ - hd },
    { x: centerX + hw, z: centerZ + hd }, { x: centerX - hw, z: centerZ + hd },
  ];
  return setCeilingCutoutPolygon(project, roomId, cutoutId, polygon);
}
