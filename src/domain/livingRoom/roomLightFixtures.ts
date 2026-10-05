import type { InteriorProject, LightEntity, ParameterValue } from "../interiorProject";
import { orientWallForRoom, roomPlanViewBounds, selectRoomWalls } from "../interiorProject";
import { isLightKelvin, kelvinToHex } from "./lightColorTemperature";
import {
  attachLightToCeiling,
  attachLightToObject,
  attachLightToWall,
  readLightMount,
  resolveLightAttachment,
} from "./lightAttachments";
import { applyLightProperties } from "./lightFixtureProperties";
import {
  LIGHT_FIXTURE_DEFINITIONS,
  getLightFixtureDefinition,
  isLightFixtureKind,
  type LightFixtureDefinition,
  type LightFixtureKind,
} from "./lightFixtureRegistry";
import { LIGHT_PARAMETER_LIMITS, validParameters } from "./lightParameterLimits";
import { wallLength } from "./wallSegmentPlacement";

export { LIGHT_PARAMETER_LIMITS, validParameters };

/** Presets the Room lights popover lists. Derived from the fixture registry. */
export const ROOM_LIGHT_FIXTURES: readonly {
  id: LightFixtureKind;
  name: string;
  kind: LightFixtureDefinition["kind"];
  category: LightFixtureDefinition["category"];
}[] = LIGHT_FIXTURE_DEFINITIONS.map((definition) => ({
  id: definition.id,
  name: definition.name,
  kind: definition.kind,
  category: definition.category,
}));

export type RoomLightFixtureKind = LightFixtureKind;
export type RoomLightPatch = Partial<Pick<LightEntity, "name" | "enabled" | "color" | "intensity" | "position" | "rotation" | "parameters">>;
export type RoomLightMountTarget =
  | { kind: "free" }
  | { kind: "object"; hostObjectId: string }
  | { kind: "wall"; wallId: string }
  | { kind: "ceiling" };

export function isRoomLightFixture(light: LightEntity) {
  return isLightFixtureKind(light.parameters.fixtureKind);
}

function nextFixtureId(project: InteriorProject) {
  let serial = 1;
  while (project.lights.some((light) => light.id === `room-fixture-${serial}`)) serial += 1;
  return `room-fixture-${serial}`;
}

function seedParameters(definition: LightFixtureDefinition): Record<string, ParameterValue> {
  const defaults = definition.defaults;
  const parameters: Record<string, ParameterValue> = {
    fixtureKind: definition.id,
    widthMm: defaults.widthMm,
    heightMm: defaults.heightMm,
    depthMm: defaults.depthMm,
    rangeMm: defaults.rangeMm,
    colorTemperatureK: defaults.colorTemperatureK,
  };
  if (defaults.beamAngleDeg !== undefined) parameters.beamAngleDeg = defaults.beamAngleDeg;
  if (defaults.headCount !== undefined) parameters.headCount = defaults.headCount;
  if (defaults.aimAngleDeg !== undefined) parameters.aimAngleDeg = defaults.aimAngleDeg;
  if (defaults.profileFinish) parameters.profileFinish = defaults.profileFinish;
  if (defaults.orientation) parameters.orientation = defaults.orientation;
  return parameters;
}

function freeLight(project: InteriorProject, roomId: string, definition: LightFixtureDefinition): LightEntity | null {
  const room = project.rooms.find((item) => item.id === roomId);
  if (!room) return null;
  const bounds = roomPlanViewBounds(project, room.id);
  const y = definition.defaults.absoluteYMm ?? room.dimensions.heightMm - definition.defaults.ceilingDropMm;
  return {
    id: nextFixtureId(project),
    roomId: room.id,
    name: definition.name,
    kind: definition.kind,
    enabled: true,
    color: kelvinToHex(definition.defaults.colorTemperatureK),
    intensity: definition.defaults.intensity,
    position: { x: bounds.centerX, y: Math.max(100, y), z: bounds.centerZ },
    rotation: { x: definition.defaults.rotationX, y: 0, z: 0 },
    parameters: seedParameters(definition),
  };
}

export function addRoomLightFixture(
  project: InteriorProject,
  kind: RoomLightFixtureKind,
  mount?: RoomLightMountTarget,
): InteriorProject {
  const roomId = project.activeRoomId;
  if (!roomId || !isLightFixtureKind(kind)) return project;
  const definition = getLightFixtureDefinition(kind);
  if (mount && !definition.mounts.includes(mount.kind)) return project;
  const light = freeLight(project, roomId, definition);
  if (!light) return project;
  if (mount?.kind === "object" && !project.objects.some((object) => object.id === mount.hostObjectId && object.roomId === roomId)) return project;
  if (mount?.kind === "wall" && !selectRoomWalls(project, roomId).some((wall) => wall.id === mount.wallId)) return project;
  const withLight = { ...project, lights: [...project.lights, light] };
  if (!mount || mount.kind === "free") return withLight;
  if (mount.kind === "object") return attachLightToObject(withLight, light.id, mount.hostObjectId);
  if (mount.kind === "ceiling") return attachLightToCeiling(withLight, light.id, definition.defaults.ceilingDropMm);
  return attachAddedWall(withLight, light.id, mount.wallId, definition);
}

function attachAddedWall(
  project: InteriorProject,
  lightId: string,
  wallId: string,
  definition: LightFixtureDefinition,
): InteriorProject {
  const light = project.lights.find((item) => item.id === lightId);
  if (!light?.roomId) return project;
  const stored = selectRoomWalls(project, light.roomId).find((wall) => wall.id === wallId);
  if (!stored) return project;
  const wall = orientWallForRoom(project, light.roomId, stored);
  const depth = definition.defaults.depthMm;
  const cove = definition.id === "cove";
  return attachLightToWall(project, lightId, {
    hostWallId: wallId,
    alongMm: wallLength(wall) / 2,
    centerHeightMm: cove ? wall.heightMm - depth : definition.defaults.wallCenterHeightMm ?? 1200,
    wallSide: "interior",
    fitHostWidth: cove,
  });
}

/** Room-scoped updates. Re-resolves the mount so the pose cache stays current. */
export function updateRoomLightFixture(project: InteriorProject, id: string, patch: RoomLightPatch): InteriorProject {
  return {
    ...project,
    lights: project.lights.map((light) => {
      if (light.id !== id || light.roomId !== project.activeRoomId || !isRoomLightFixture(light)) return light;
      return editFixture(project, light, patch);
    }),
  };
}

function editFixture(project: InteriorProject, light: LightEntity, patch: RoomLightPatch): LightEntity {
  const kelvin = patch.parameters?.colorTemperatureK;
  if (kelvin !== undefined && !isLightKelvin(kelvin)) return light;
  const merged: LightEntity = {
    ...light,
    ...patch,
    parameters: { ...light.parameters, ...patch.parameters, fixtureKind: light.parameters.fixtureKind },
  };
  const next = applyLightProperties(merged, {
    enabled: patch.enabled,
    intensity: patch.intensity,
    ...(typeof kelvin === "number" ? { colorTemperature: kelvin } : {}),
    ...(kelvin === undefined && patch.color !== undefined ? { color: patch.color } : {}),
  });
  if (!Number.isFinite(next.intensity) || next.intensity < 0 || next.intensity > 100) return light;
  if (!Object.values(next.position).every(Number.isFinite)) return light;
  if (!Object.values(next.rotation).every(Number.isFinite)) return light;
  if (!/^#[\da-f]{6}$/i.test(next.color)) return light;
  if (!validParameters(next.parameters)) return light;
  const named = { ...next, name: next.name.trim().slice(0, 100) || light.name };
  const resolved = resolveLightAttachment(project, named);
  return resolved.parameters.attachmentMissing === true ? { ...resolved, enabled: named.enabled } : resolved;
}

export function removeRoomLightFixture(project: InteriorProject, id: string): InteriorProject {
  return {
    ...project,
    lights: project.lights.filter((light) =>
      !(light.id === id && light.roomId === project.activeRoomId && isRoomLightFixture(light))),
  };
}

export function duplicateRoomLightFixture(project: InteriorProject, id: string): InteriorProject {
  const source = project.lights.find((light) =>
    light.id === id && light.roomId === project.activeRoomId && isRoomLightFixture(light));
  if (!source) return project;
  const mount = readLightMount(source);
  const copy: LightEntity = {
    ...source,
    id: nextFixtureId(project),
    name: `${source.name} copy`.slice(0, 100),
    position: { ...source.position, x: source.position.x + (mount.kind === "wall" ? 0 : 200) },
    rotation: { ...source.rotation },
    parameters: {
      ...source.parameters,
      ...(mount.kind === "wall" ? { alongMm: mount.alongMm + 200 } : {}),
      ...(mount.kind === "object" ? { offsetXmm: mount.offsetXmm + 200 } : {}),
    },
  };
  const resolved = resolveLightAttachment(project, copy);
  const light = resolved.parameters.attachmentMissing === true ? { ...resolved, enabled: copy.enabled } : resolved;
  return { ...project, lights: [...project.lights, light] };
}

