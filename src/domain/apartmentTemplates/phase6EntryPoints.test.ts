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
      // Carpet (inside wall faces) is smaller than the centreline footprint, but not by more than walls take.
      expect(card.carpetM2).toBeLessThan(card.footprintM2);
      expect(card.carpetM2).toBeGreaterThan(card.footprintM2 * 0.8);
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
    // Every id is unique inside each document; factory-minted ids (openings, objects, cameras) are
    // never shared between the two opens. Shell ids (rooms, walls, light rig) are document-local
    // sequential ids from the editor commands and may repeat across separate projects.
    const allIds = (doc: typeof a.document) => [
      ...doc.rooms, ...doc.walls, ...doc.openings, ...doc.objects, ...doc.lights, ...doc.cameras,
    ].map((entity) => entity.id);
    for (const doc of [a.document, b.document]) {
      expect(new Set(allIds(doc)).size).toBe(allIds(doc).length);
    }
    const minted = (doc: typeof a.document) =>
      [...doc.openings, ...doc.objects, ...doc.cameras].map((entity) => entity.id);
    const aIds = minted(a.document);
    const bIds = new Set(minted(b.document));
    expect(aIds.length).toBeGreaterThan(20);
    expect(aIds.filter((id) => bIds.has(id))).toEqual([]);
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

  it("stashes and consumes a pending register handoff once (injected storage, no globals)", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    };
    stashPendingTemplate("template:apartment:1bhk:v1", storage, 1_000);
    expect(JSON.parse(store.get(PENDING_TEMPLATE_STORAGE_KEY)!).templateId).toBe("template:apartment:1bhk:v1");
    expect(takePendingTemplate(storage, 1_000)).toBe("template:apartment:1bhk:v1");
    expect(takePendingTemplate(storage)).toBeNull();
    // Outside a browser the default storage is null: no throw, nothing stashed.
    expect(() => stashPendingTemplate("template:apartment:1bhk:v1", null)).not.toThrow();
    expect(takePendingTemplate(null)).toBeNull();
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
