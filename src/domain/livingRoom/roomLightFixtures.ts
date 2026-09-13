import type { InteriorProject, LightEntity, ParameterValue } from "../interiorProject";
import { roomPlanViewBounds } from "../interiorProject/roomPlanBounds";
import { DEFAULT_LIGHT_KELVIN, isLightKelvin, kelvinToHex } from "./lightColorTemperature";

export const ROOM_LIGHT_FIXTURES = [
  { id: "ceiling-downlight", name: "Ceiling downlight", kind: "spot" },
  { id: "pendant", name: "Pendant light", kind: "point" },
  { id: "under-cabinet", name: "Under-cabinet LED strip", kind: "area" },
  { id: "cove", name: "Cove LED strip", kind: "area" },
] as const;
export type RoomLightFixtureKind = typeof ROOM_LIGHT_FIXTURES[number]["id"];
export type RoomLightPatch = Partial<Pick<LightEntity, "name" | "enabled" | "color" | "intensity" | "position" | "rotation" | "parameters">>;

function withoutKelvin(parameters: Record<string, ParameterValue>) {
  const next = { ...parameters };
  delete next.colorTemperatureK;
  return next;
}

export function isRoomLightFixture(light: LightEntity) {
  return ROOM_LIGHT_FIXTURES.some((preset) => preset.id === light.parameters.fixtureKind);
}

export function addRoomLightFixture(project: InteriorProject, kind: RoomLightFixtureKind): InteriorProject {
  const room = project.rooms.find((item) => item.id === project.activeRoomId);
  const preset = ROOM_LIGHT_FIXTURES.find((item) => item.id === kind);
  if (!room || !preset) return project;
  let serial = 1;
  while (project.lights.some((light) => light.id === `room-fixture-${serial}`)) serial++;
  const bounds = roomPlanViewBounds(project, room.id);
  const strip = preset.kind === "area";
  const height = kind === "under-cabinet" ? 1450 : kind === "pendant" ? room.dimensions.heightMm - 650 : room.dimensions.heightMm - 80;
  const light: LightEntity = {
    id: `room-fixture-${serial}`, roomId: room.id, name: preset.name,
    kind: preset.kind, enabled: true, color: kelvinToHex(DEFAULT_LIGHT_KELVIN), intensity: strip ? 3 : 5,
    position: { x: bounds.centerX, y: Math.max(100, height), z: bounds.centerZ },
    rotation: { x: kind === "cove" ? 90 : -90, y: 0, z: 0 },
    parameters: { fixtureKind: kind, widthMm: strip ? 1000 : 100, heightMm: strip ? 20 : 100, rangeMm: 5000,
      colorTemperatureK: DEFAULT_LIGHT_KELVIN },
  };
  return { ...project, lights: [...project.lights, light] };
}

/** Room-scoped updates; keep recipe lights and other rooms untouched. */
export function updateRoomLightFixture(project: InteriorProject, id: string, patch: RoomLightPatch): InteriorProject {
  return { ...project, lights: project.lights.map((light) => {
    if (light.id !== id || light.roomId !== project.activeRoomId || !isRoomLightFixture(light)) return light;
    const merged: LightEntity = { ...light, ...patch, parameters: { ...light.parameters, ...patch.parameters, fixtureKind: light.parameters.fixtureKind } };
    const kelvin = patch.parameters?.colorTemperatureK;
    if (kelvin !== undefined && !isLightKelvin(kelvin)) return light;
    // Kelvin drives the colour; a hand-picked colour is no longer a temperature.
    const next: LightEntity = kelvin !== undefined
      ? { ...merged, color: kelvinToHex(kelvin) }
      : patch.color !== undefined
        ? { ...merged, parameters: withoutKelvin(merged.parameters) }
        : merged;
    if (!Number.isFinite(next.intensity) || next.intensity < 0 || next.intensity > 100) return light;
    if (!Object.values(next.position).every(Number.isFinite) || !Object.values(next.rotation).every(Number.isFinite)) return light;
    if (!/^#[\da-f]{6}$/i.test(next.color)) return light;
    for (const key of ["widthMm", "heightMm", "rangeMm"]) {
      const value = Number(next.parameters[key]);
      if (!Number.isFinite(value) || value <= 0 || value > 100000) return light;
    }
    return { ...next, name: next.name.trim().slice(0, 100) || light.name };
  }) };
}

export function removeRoomLightFixture(project: InteriorProject, id: string): InteriorProject {
  return { ...project, lights: project.lights.filter((light) =>
    !(light.id === id && light.roomId === project.activeRoomId && isRoomLightFixture(light))) };
}
