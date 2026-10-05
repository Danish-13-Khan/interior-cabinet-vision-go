import { describe, expect, it } from "vitest";
import { buildLivingRoomStarterDocument } from "../livingRoom/buildStarterDocument";
import { APARTMENT_TEMPLATE_CARDS } from "./apartmentCards";
import { APARTMENT_TEMPLATE_IDS } from "./instantiateApartmentTemplate";
import {
  PENDING_TEMPLATE_STORAGE_KEY,
  stashPendingTemplate,
  takePendingTemplate,
} from "./pendingTemplateHandoff";
import { showcaseCameraForRoom } from "./showcaseCamera";
import { instantiateApartmentTemplate } from "./instantiateApartmentTemplate";

describe("Phase 6 apartment entry points", () => {
  it("lists four project-home cards with area and room count", () => {
    expect(APARTMENT_TEMPLATE_CARDS.map((c) => c.id)).toEqual([...APARTMENT_TEMPLATE_IDS]);
    for (const card of APARTMENT_TEMPLATE_CARDS) {
      expect(card.areaM2).toBeGreaterThan(0);
      expect(card.roomCount).toBeGreaterThan(0);
      expect(card.name.length).toBeGreaterThan(0);
    }
  });

  it("product opens use unique ids so two Studios do not clash", () => {
    const a = buildLivingRoomStarterDocument({
      apartmentTemplateId: "template:apartment:studio:v1",
      projectId: "proj-a",
      now: "2026-10-06T00:00:00.000Z",
    });
    const b = buildLivingRoomStarterDocument({
      apartmentTemplateId: "template:apartment:studio:v1",
      projectId: "proj-b",
      now: "2026-10-06T00:00:00.000Z",
    });
    expect(a.document.extensions?.apartmentTemplateId).toBe("template:apartment:studio:v1");
    expect(a.document.id).toBe("proj-a");
    expect(b.document.id).toBe("proj-b");
    const aRoomIds = a.document.rooms.map((r) => r.id).sort();
    const bRoomIds = b.document.rooms.map((r) => r.id).sort();
    expect(aRoomIds).not.toEqual(bRoomIds);
  });

  it("keeps deterministic ids when uniqueIds is false (authoring / tests)", () => {
    const a = buildLivingRoomStarterDocument({
      apartmentTemplateId: "template:apartment:studio:v1",
      uniqueIds: false,
      projectId: "proj-a",
      now: "2026-10-06T00:00:00.000Z",
    });
    const b = buildLivingRoomStarterDocument({
      apartmentTemplateId: "template:apartment:studio:v1",
      uniqueIds: false,
      projectId: "proj-b",
      now: "2026-10-06T00:00:00.000Z",
    });
    expect(a.document.rooms.map((r) => r.id)).toEqual(b.document.rooms.map((r) => r.id));
  });

  it("stashes and consumes a pending register handoff once", () => {
    sessionStorage.clear();
    stashPendingTemplate("template:apartment:1bhk:v1");
    expect(sessionStorage.getItem(PENDING_TEMPLATE_STORAGE_KEY)).toBe("template:apartment:1bhk:v1");
    expect(takePendingTemplate()).toBe("template:apartment:1bhk:v1");
    expect(takePendingTemplate()).toBeNull();
  });

  it("resolves a showcase bookmark camera per authored room", () => {
    const project = instantiateApartmentTemplate("template:apartment:studio:v1");
    for (const room of project.rooms) {
      const camera = showcaseCameraForRoom(project, room.id);
      expect(camera, room.name).not.toBeNull();
      expect(camera!.roomId).toBe(room.id);
    }
  });
});
