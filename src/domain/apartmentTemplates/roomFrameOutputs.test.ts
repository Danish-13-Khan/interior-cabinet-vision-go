import { describe, expect, it } from "vitest";
import {
  COUNTERTOP_HOST_MAX_HEIGHT_MM,
  createCabinetPlanningWorkflow,
  FILLER_MAX_MM,
  FILLER_MIN_MM,
} from "../cabinetRuns";
import { worktopTopsByObjectId } from "../hostedAppliances";
import {
  cabinetProjectFromInteriorProject,
  pointInRoomPolygon,
  roomPlanPolygon,
  type InteriorProject,
} from "../interiorProject";
import { roomFrame } from "../interiorProject/roomFrame";
import { compileCabinetRunExtras } from "../livingRoom/cabinetSceneRunExtras";
import { isCabinetRunFiller } from "../livingRoom/cabinetRunFillers";
import { compileLivingRoomScene } from "../livingRoom/sceneCompiler";
import { buildReportItemList } from "../projectReport/scheduleRows";
import { createTechnicalView } from "../technicalViews";
import { SCALE } from "../technicalViews/constants";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { objectBox } from "./composers/objectBounds";
import { APARTMENT_TEMPLATE_IDS, composeApartment, lookupApartmentTemplate } from "./index";

const built = APARTMENT_TEMPLATE_IDS.map((id) => ({
  id,
  project: composeApartment(lookupApartmentTemplate(id)!, { now: COMPOSER_TEST_NOW }),
}));

function planRoom(project: InteriorProject, roomId: string) {
  const adapted = cabinetProjectFromInteriorProject({ ...project, activeRoomId: roomId });
  const { widthMm, depthMm, heightMm } = adapted.room.dimensions;
  return {
    adapted,
    frame: roomFrame(project, roomId),
    workflow: createCabinetPlanningWorkflow(adapted.project, { widthMm, depthMm, heightMm }),
  };
}

function svgRect(svg: string, pattern: RegExp) {
  const match = svg.match(pattern);
  if (!match) return null;
  return { x: Number(match[1]), y: Number(match[2]), width: Number(match[3]), height: Number(match[4]) };
}

function planCabinetRects(svg: string) {
  const rects = [];
  const pattern = /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" data-cabinet-id="[^"]+" class="[^"]*twod-cabinet-(?:floor|wall|rotated)/g;
  for (const match of svg.matchAll(pattern)) {
    rects.push({
      x: Number(match[1]),
      y: Number(match[2]),
      width: Number(match[3]),
      height: Number(match[4]),
    });
  }
  return rects;
}

type SvgBox = { x: number; y: number; width: number; height: number };

function rectInside(inner: SvgBox, outer: SvgBox, slack = 0.01) {
  return inner.x >= outer.x - slack
    && inner.y >= outer.y - slack
    && inner.x + inner.width <= outer.x + outer.width + slack
    && inner.y + inner.height <= outer.y + outer.height + slack;
}

/** Outline is the wall centreline. A carcass may cross it by less than half the wall. */
function planRectInRoom(cabinet: SvgBox, room: SvgBox, wallSlack: number) {
  const centre = { x: cabinet.x + cabinet.width / 2, y: cabinet.y + cabinet.height / 2 };
  const centreInRoom = centre.x >= room.x && centre.x <= room.x + room.width
    && centre.y >= room.y && centre.y <= room.y + room.height;
  return centreInRoom && rectInside(cabinet, {
    x: room.x - wallSlack,
    y: room.y - wallSlack,
    width: room.width + wallSlack * 2,
    height: room.height + wallSlack * 2,
  });
}

function expectOnBox(x: number, z: number, box: ReturnType<typeof objectBox>) {
  expect(x).toBeGreaterThanOrEqual(box.minX - 25);
  expect(x).toBeLessThanOrEqual(box.maxX + 25);
  expect(z).toBeGreaterThanOrEqual(box.minZ - 25);
  expect(z).toBeLessThanOrEqual(box.maxZ + 25);
}

describe("apartment room frame outputs sit on their cabinets", () => {
  it.each(built.map((entry) => [entry.id, entry.project] as const))("%s countertop lengths", (_id, project) => {
    let lengths = 0;
    for (const room of project.rooms) {
      const { workflow } = planRoom(project, room.id);
      const nodes = compileCabinetRunExtras({ ...project, activeRoomId: room.id });
      for (const segment of workflow.countertops) {
        lengths += 1;
        expect(segment.widthMm).toBeGreaterThan(0);
        const node = nodes.find((item) => item.metadata.countertopId === segment.id);
        if (node) expect(node.metadata.widthMm).toBe(segment.widthMm);
      }
    }
    expect(lengths).toBeGreaterThan(0);
  });

  it.each(built.map((entry) => [entry.id, entry.project] as const))("%s fillers", (_id, project) => {
    expect(project.rooms.length).toBeGreaterThan(0);
    for (const room of project.rooms) {
      const polygon = roomPlanPolygon(project, room.id);
      const { frame, workflow } = planRoom(project, room.id);
      for (const filler of workflow.fillers) {
        expect(filler.widthMm).toBeGreaterThanOrEqual(FILLER_MIN_MM);
        expect(filler.widthMm).toBeLessThanOrEqual(FILLER_MAX_MM);
        const x = filler.position.x + frame.centre.x;
        const z = filler.position.z + frame.centre.z;
        expect(polygon && pointInRoomPolygon({ x, z }, polygon)).toBe(true);
        const hosts = workflow.runs.find((run) => run.id === filler.runId)?.cabinetIds ?? [];
        const nearest = Math.min(...hosts.map((id) => {
          const host = project.objects.find((object) => object.id === id);
          return host ? Math.hypot(host.position.x - x, host.position.z - z) : Infinity;
        }));
        expect(nearest).toBeLessThan(1500);
      }
    }
    for (const filler of project.objects.filter(isCabinetRunFiller)) {
      const polygon = roomPlanPolygon(project, filler.roomId);
      expect(polygon && pointInRoomPolygon({ x: filler.position.x, z: filler.position.z }, polygon)).toBe(true);
      expect(filler.dimensions.widthMm).toBeGreaterThan(0);
    }
  });

  it.each(built.map((entry) => [entry.id, entry.project] as const))("%s worktop heights", (_id, project) => {
    const tops = worktopTopsByObjectId(project);
    let hosts = 0;
    for (const room of project.rooms) {
      const { workflow } = planRoom(project, room.id);
      for (const segment of workflow.countertops) {
        for (const cabinetId of segment.cabinetIds) {
          const host = project.objects.find((object) => object.id === cabinetId);
          expect(host, cabinetId).toBeTruthy();
          if (host!.dimensions.heightMm > COUNTERTOP_HOST_MAX_HEIGHT_MM) {
            expect(tops.has(cabinetId)).toBe(false);
            continue;
          }
          hosts += 1;
          const top = tops.get(cabinetId);
          expect(top).toBe(segment.positionY + segment.thicknessMm);
          expect(top!).toBeGreaterThanOrEqual(host!.position.y + host!.dimensions.heightMm);
        }
      }
    }
    expect(hosts).toBeGreaterThan(0);
  });

  it.each(built.map((entry) => [entry.id, entry.project] as const))("%s drawings and schedule", (_id, project) => {
    for (const room of project.rooms) {
      const { adapted, frame, workflow } = planRoom(project, room.id);
      const drawing = createTechnicalView(adapted.project, adapted.room, "top", workflow.countertops);
      expect(drawing.svg.length).toBeGreaterThan(100);
      if (adapted.project.cabinets.length > 0) {
        const outline = svgRect(drawing.svg, /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" class="[^"]*twod-plan-floor/);
        const cabinets = planCabinetRects(drawing.svg);
        expect(outline, room.id).toBeTruthy();
        const wallSlack = adapted.room.dimensions.wallThicknessMm / 2 / SCALE;
        expect(cabinets.some((rect) => planRectInRoom(rect, outline!, wallSlack)), room.id).toBe(true);
      }
      const rows = buildReportItemList(adapted.project);
      for (const cabinet of adapted.project.cabinets) {
        const object = project.objects.find((item) => item.id === (cabinet.interiorObjectId ?? cabinet.id));
        if (!object) continue;
        const box = objectBox(object);
        expectOnBox(cabinet.placement.x + frame.centre.x, cabinet.placement.z + frame.centre.z, box);
        const row = rows.find((item) => item.id === cabinet.id);
        expect(row).toBeTruthy();
        expectOnBox(row!.x, row!.z, box);
      }
    }
  });

  it.each(built.map((entry) => [entry.id, entry.project] as const))("%s recipe lights", (_id, project) => {
    const recipe = project.lights.find((light) => light.enabled && typeof light.parameters.recipeId === "string");
    expect(recipe?.roomId).toBeTruthy();
    const roomId = recipe!.roomId!;
    const polygon = roomPlanPolygon(project, roomId);
    const frame = roomFrame(project, roomId);
    const scene = compileLivingRoomScene({ ...project, activeRoomId: roomId });
    const enabled = scene.lights.filter((light) => light.enabled && typeof light.parameters.recipeId === "string");
    expect(enabled.length).toBeGreaterThan(0);
    for (const light of enabled) {
      expect(polygon && pointInRoomPolygon({ x: light.position.x, z: light.position.z }, polygon)).toBe(true);
      if (light.kind === "directional") {
        expect(light.parameters.targetXMm).toBe(frame.centre.x);
        expect(light.parameters.targetZMm).toBe(frame.centre.z);
      }
    }
  });
});
