import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../preset";
import { addLivingRoomObject, resizeLivingRoomObject } from "../planCommands";
import { createLivingRoomObject } from "../catalog";
import { millworkRefsFromProject } from "../stillJob/sceneRefs";
import {
  buildLivingRoomMillworkSchedule,
  formatMaterialIds,
  millworkScheduleFileBase,
} from "./buildSchedule";
import { millworkScheduleToCsv } from "./scheduleCsv";
import { MILLWORK_SCHEDULE_HONESTY_NOTE } from "./types";

const NOW = "2026-08-15T10:30:00.000Z";

describe("Living-room Millwork Schedule v1", () => {
  it("lists millwork instances with live Plan/Model millimetres and skips soft goods", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const roomId = project.activeRoomId ?? project.rooms[0]!.id;
    const withBookcase = addLivingRoomObject(
      project,
      createLivingRoomObject("living:bookcase", {
        id: "lr-object-bookcase-test",
        roomId,
        position: { x: 1800, y: 0, z: -1800 },
      }),
    );
    const schedule = buildLivingRoomMillworkSchedule(withBookcase, NOW);
    const millworkIds = millworkRefsFromProject(withBookcase).map((item) => item.id);
    expect(schedule.version).toBe(1);
    expect(schedule.honestyNote).toBe(MILLWORK_SCHEDULE_HONESTY_NOTE);
    expect(schedule.lines.map((line) => line.objectId)).toEqual(millworkIds);
    expect(schedule.lines.every((line) => line.quantity === 1)).toBe(true);
    expect(schedule.lines.some((line) => line.category === "media-unit")).toBe(true);
    expect(schedule.lines.some((line) => line.category === "storage")).toBe(true);
    expect(schedule.lines.some((line) => line.category === "sofa")).toBe(false);
  });

  it("updates width when the same millwork entity is resized", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const tv = project.objects.find((object) => object.catalogItemId === "living:tv-unit")!;
    const resized = resizeLivingRoomObject(project, tv.id, {
      ...tv.dimensions,
      widthMm: 2200,
    });
    const schedule = buildLivingRoomMillworkSchedule(resized, NOW);
    const line = schedule.lines.find((item) => item.objectId === tv.id)!;
    expect(line.widthMm).toBe(2200);
    expect(line.heightMm).toBe(tv.dimensions.heightMm);
    expect(millworkScheduleToCsv(schedule)).toContain("2200");
    expect(formatMaterialIds(line.materialSlots)).toContain("carcass=");
  });

  it("exports a valid empty table when no millwork is present", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const stripped = { ...project, objects: project.objects.filter((object) => object.category === "sofa") };
    const schedule = buildLivingRoomMillworkSchedule(stripped, NOW);
    expect(schedule.lines).toEqual([]);
    expect(millworkScheduleToCsv(schedule)).toBe(
      "objectId,name,category,kind,roomId,widthMm,heightMm,depthMm,materialIds,quantity",
    );
    expect(millworkScheduleFileBase("Client / Living Room")).toBe("client-living-room-millwork-schedule");
  });
});
