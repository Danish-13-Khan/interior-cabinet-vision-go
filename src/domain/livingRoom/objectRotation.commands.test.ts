import { describe, expect, it } from "vitest";
import { readCabinetIdentity } from "../cabinetIdentity";
import { loadInteriorProjectFile, serializeInteriorProjectFile } from "../interiorProject";
import { createLivingRoomStarterProject, getObjectPlanCorners, rotateLivingRoomObject } from ".";
import { createGoldenCabinetSceneProject } from "./goldenCabinetScene";
import { diagnoseHandoffLoss } from "./handoff";
import { setLivingRoomObjectRotation } from "./objectRotation";

const NOW = "2026-10-05T12:00:00.000Z";

function rotationOf(project: { objects: { id: string; rotation: { y: number } }[] }, id: string) {
  return project.objects.find((object) => object.id === id)!.rotation.y;
}

function polygonArea(points: { x: number; z: number }[]) {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]!;
    return sum + point.x * next.z - next.x * point.z;
  }, 0)) / 2;
}

describe("setLivingRoomObjectRotation (Phase 2)", () => {
  it("stores a typed chair angle exactly and keeps it through save → reopen", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const chair = project.objects.find((object) => object.kind !== "cabinet")!;
    const rotated = setLivingRoomObjectRotation(project, chair.id, 37);
    expect(rotationOf(rotated, chair.id)).toBe(37);
    expect(rotationOf(setLivingRoomObjectRotation(project, chair.id, -20), chair.id)).toBe(340);
    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(rotated, NOW)).document;
    expect(rotationOf(reopened, chair.id)).toBe(37);
  });

  it("collides with the rotated footprint, not a 45° bucket", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const chair = project.objects.find((object) => object.kind !== "cabinet")!;
    const rotated = setLivingRoomObjectRotation(project, chair.id, 37);
    const corners = getObjectPlanCorners(rotated.objects.find((object) => object.id === chair.id)!);
    const xs = new Set(corners.map((point) => Math.round(point.x)));
    expect(xs.size).toBe(4);
    expect(polygonArea(corners)).toBeCloseTo(chair.dimensions.widthMm * chair.dimensions.depthMm, 0);
  });

  it("lands a cabinet typed to 37° on a quarter turn", () => {
    const project = createGoldenCabinetSceneProject(NOW);
    const cabinet = project.objects.find((object) => readCabinetIdentity(object))!;
    const typed37 = setLivingRoomObjectRotation(project, cabinet.id, cabinet.rotation.y + 37);
    expect(rotationOf(typed37, cabinet.id) % 90).toBe(0);
    const typed50 = setLivingRoomObjectRotation(project, cabinet.id, 50);
    expect(rotationOf(typed50, cabinet.id)).toBe(90);
  });

  it("keeps cabinet stepping on 90° and adds no unsupported-rotation warning", () => {
    const project = createGoldenCabinetSceneProject(NOW);
    const cabinet = project.objects.find((object) => readCabinetIdentity(object))!;
    const count = (doc: typeof project) =>
      diagnoseHandoffLoss(doc).filter((item) => item.code === "unsupported-rotation").length;
    const baseline = count(project);
    const stepped = rotateLivingRoomObject(project, cabinet.id, cabinet.rotation.y + 45);
    expect(rotationOf(stepped, cabinet.id) % 90).toBe(0);
    const typed = setLivingRoomObjectRotation(project, cabinet.id, 37);
    expect(count(stepped)).toBe(baseline);
    expect(count(typed)).toBe(baseline);
  });
});
