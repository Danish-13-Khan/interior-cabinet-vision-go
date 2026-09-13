import { selectRoomWalls, type InteriorProject, type Point2Mm } from "../interiorProject";
import { roomPlanPolygon } from "../interiorProject/roomGeometry";
import { isRoomLightFixture } from "../livingRoom/roomLightFixtures";
import { resolveLightAttachment } from "../livingRoom/lightAttachments";
import { readInteriorEstimate, type EstimateUnit } from "./state";
import { objectRateCategory } from "./categories";
import { reconcileSurfaceCharges } from "./reconcile";

export type InteriorEstimateLine = { id: string; roomId: string; roomName: string; label: string; source: string;
  category: string; unit: EstimateUnit; measured: number; quantity: number; rate: number | null; rateSource: EstimateRateSource;
  amount: number; excluded: boolean; wastePercent: number };
export type EstimateRateSource = "line" | "category" | "entered" | "missing";
export function polygonAreaM2(points: readonly Point2Mm[]) {
  return Math.abs(points.reduce((sum, a, i) => { const b = points[(i + 1) % points.length]; return sum + a.x * b.z - b.x * a.z; }, 0)) / 2e6;
}
const quantity = (n: number) => Math.round(Math.max(0, n) * 10000) / 10000;
export function measureInteriorEstimate(project: InteriorProject): InteriorEstimateLine[] {
  const state = readInteriorEstimate(project);
  const lines: InteriorEstimateLine[] = [];
  const add = (id: string, roomId: string, label: string, unit: EstimateUnit, measured: number, source: string,
    category: string, suppliedRate?: number) => {
    const override = state.overrides[id];
    const categoryRate = state.categoryRates[category];
    const rate = override?.rate ?? categoryRate ?? suppliedRate ?? null;
    const rateSource: EstimateRateSource = override?.rate !== undefined ? "line"
      : categoryRate !== undefined ? "category" : suppliedRate !== undefined ? "entered" : "missing";
    const wastePercent = override?.wastePercent ?? 0;
    const qty = quantity(measured * (1 + wastePercent / 100));
    lines.push({ id, roomId, roomName: project.rooms.find((room) => room.id === roomId)?.name ?? "Project",
      label, source, category, unit, measured: quantity(measured), quantity: qty, rate, rateSource, wastePercent,
      amount: Math.round(qty * (rate ?? 0)), excluded: override?.excluded === true });
  };
  for (const room of project.rooms) {
    const polygon = roomPlanPolygon(project, room.id);
    const area = polygon ? polygonAreaM2(polygon.outer) - polygon.holes.reduce((sum, hole) => sum + polygonAreaM2(hole), 0)
      : room.dimensions.widthMm * room.dimensions.depthMm / 1e6;
    for (const kind of ["floor", "ceiling"] as const) {
      add(`room:${room.id}:${kind}`, room.id, `${kind === "floor" ? "Floor" : "Ceiling"} finish — whole room`, "m2", area,
        `${room.id}: ${polygon ? "room polygon minus holes" : "room width × depth"}; full coverage, zones not added separately`,
        `surface.${kind}`);
    }
    for (const wall of selectRoomWalls(project, room.id)) {
      const gross = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z) * wall.heightMm;
      const openings = project.openings.filter((opening) => opening.wallId === wall.id).reduce((sum, opening) =>
        sum + opening.widthMm * Math.max(0, Math.min(opening.heightMm, wall.heightMm - opening.sillHeightMm)), 0);
      add(`room:${room.id}:wall:${wall.id}`, room.id, "Wall finish — room face", "m2", (gross - openings) / 1e6,
        `${wall.id}: length × height minus openings; one face in this room`, "surface.wall");
    }
  }
  for (const object of project.objects) {
    if (object.kind === "cabinet" || object.category === "structural-column") continue;
    add(`object:${object.id}`, object.roomId, object.name, "each", 1, object.id, objectRateCategory(object));
  }
  for (const raw of project.lights.filter(isRoomLightFixture)) {
    const light = resolveLightAttachment(project, raw);
    const strip = light.kind === "area";
    add(`light:${light.id}`, light.roomId ?? "", light.name, strip ? "lm" : "each",
      strip ? Number(light.parameters.widthMm) / 1000 : 1, light.id, strip ? "light.strip" : "light.fixture");
  }
  for (const line of state.manual) add(`manual:${line.id}`, line.roomId, line.label, line.unit, line.quantity, "Customer-entered quantity", "manual", line.rate);
  return lines;
}
export function interiorEstimateSummary(project: InteriorProject) {
  const state = readInteriorEstimate(project);
  const lines = state.enabled ? measureInteriorEstimate(project).filter((line) => !line.excluded) : [];
  return { enabled: state.enabled, lines, missing: lines.filter((line) => line.rate === null && line.quantity > 0),
    conflicts: reconcileSurfaceCharges(lines), total: lines.reduce((sum, line) => sum + line.amount, 0) };
}
