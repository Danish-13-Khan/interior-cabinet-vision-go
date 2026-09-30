import type { InteriorProject, LightEntity } from "../../domain/interiorProject";
import { orientWallForRoom, selectRoomWalls } from "../../domain/interiorProject";
import {
  attachLightToObject,
  detachLight,
  readLightMount,
  updateLightMount,
  type LightMount,
} from "../../domain/livingRoom/lightAttachments";
import { fixtureNumber } from "../../domain/livingRoom/lightFixtureProperties";
import { lightFixtureDefinitionFor } from "../../domain/livingRoom/lightFixtureTypes";
import { wallLength } from "../../domain/livingRoom/wallSegmentPlacement";

export type LightDocumentPatch = (
  update: (current: InteriorProject) => InteriorProject,
  status: string,
) => void;

export function mountSelectValue(light: LightEntity): string {
  const mount = readLightMount(light);
  if (mount.kind === "wall") return `wall:${mount.hostWallId}`;
  if (mount.kind === "object") return `object:${mount.hostObjectId}`;
  if (mount.kind === "ceiling") return "ceiling";
  return "free";
}

export function hostCaption(project: InteriorProject, light: LightEntity): string {
  const mount = readLightMount(light);
  if (mount.kind === "ceiling") return `${light.name} on the ceiling`;
  if (mount.kind === "object") {
    const host = project.objects.find((object) => object.id === mount.hostObjectId);
    return `${light.name} on ${host?.name ?? "cabinet"}`;
  }
  if (mount.kind === "wall") {
    const wall = project.walls.find((item) => item.id === mount.hostWallId);
    const side = wall?.extensions?.wallSide;
    return `${light.name} on ${typeof side === "string" ? side : "selected"} wall`;
  }
  return light.name;
}

/** Switch host. Wall cove fits the wall and sits at the top; other kinds keep their defaults. */
export function chooseFixtureHost(project: InteriorProject, light: LightEntity, value: string): InteriorProject {
  if (value === "free") return detachLight(project, light.id);
  if (value === "ceiling") {
    const definition = lightFixtureDefinitionFor(light);
    const drop = fixtureNumber(light, "ceilingDropMm", definition?.defaults.ceilingDropMm ?? 80);
    return updateLightMount(project, light.id, { kind: "ceiling", ceilingDropMm: drop });
  }
  if (value.startsWith("object:")) return attachLightToObject(project, light.id, value.slice("object:".length));
  if (value.startsWith("wall:")) return attachToWall(project, light, value.slice("wall:".length));
  return project;
}

function attachToWall(project: InteriorProject, light: LightEntity, hostWallId: string): InteriorProject {
  if (!light.roomId) return project;
  const stored = selectRoomWalls(project, light.roomId).find((wall) => wall.id === hostWallId);
  if (!stored) return project;
  const wall = orientWallForRoom(project, light.roomId, stored);
  const definition = lightFixtureDefinitionFor(light);
  const depth = fixtureNumber(light, "depthMm", definition?.defaults.depthMm ?? 20);
  const cove = definition?.id === "cove";
  return updateLightMount(project, light.id, {
    kind: "wall",
    hostWallId,
    alongMm: wallLength(wall) / 2,
    centerHeightMm: cove ? wall.heightMm - depth : definition?.defaults.wallCenterHeightMm ?? 1200,
    wallSide: "interior",
    fitHostWidth: cove,
  });
}

export function patchWallMount(
  project: InteriorProject,
  light: LightEntity,
  patch: Partial<Extract<LightMount, { kind: "wall" }>>,
): InteriorProject {
  const mount = readLightMount(light);
  if (mount.kind !== "wall") return project;
  return updateLightMount(project, light.id, { ...mount, ...patch });
}
