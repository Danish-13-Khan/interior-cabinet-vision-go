import { describe, expect, it } from "vitest";
import { pendingTemplateOffer } from "./pendingTemplateOffer";
import { PENDING_TEMPLATE_STORAGE_KEY, stashPendingTemplate } from "./pendingTemplateHandoff";
import { instantiateApartmentTemplate } from "./instantiateApartmentTemplate";
import { showcaseCameraPatch } from "./showcaseCamera";

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  };
}

describe("register → editor handoff", () => {
  it("offers the stashed template without consuming it", () => {
    const storage = memoryStorage();
    expect(pendingTemplateOffer(storage)).toBeNull();
    stashPendingTemplate("template:apartment:2bhk:v1", storage);
    const offer = pendingTemplateOffer(storage);
    expect(offer).toMatchObject({ templateId: "template:apartment:2bhk:v1", kind: "apartment" });
    // Reading the offer (e.g. opening the project home) never clears or creates anything.
    expect(storage.store.get(PENDING_TEMPLATE_STORAGE_KEY)).toBe("template:apartment:2bhk:v1");
    expect(pendingTemplateOffer(null)).toBeNull();
  });

  it("ignores unknown template ids", () => {
    const storage = memoryStorage();
    stashPendingTemplate("template:nope", storage);
    expect(pendingTemplateOffer(storage)).toBeNull();
  });
});

describe("showcase view camera patch", () => {
  it("points at the room's showcase camera, null when unchanged (no empty undo)", () => {
    const project = instantiateApartmentTemplate("template:apartment:studio:v1");
    const room = project.rooms.find((item) => item.id !== project.activeRoomId) ?? project.rooms[0]!;
    const patch = showcaseCameraPatch(project, room.id);
    expect(patch?.activeCameraId).toBeTruthy();
    const applied = { ...project, renderSettings: { ...project.renderSettings, ...patch } };
    expect(showcaseCameraPatch(applied, room.id)).toBeNull();
  });

  it("a room without a camera clears the previous room's camera", () => {
    const project = instantiateApartmentTemplate("template:apartment:studio:v1");
    const room = project.rooms[0]!;
    const withoutCameras = {
      ...project,
      cameras: project.cameras.filter((camera) => camera.roomId !== room.id),
    };
    expect(withoutCameras.renderSettings.activeCameraId).toBeTruthy();
    expect(showcaseCameraPatch(withoutCameras, room.id)).toEqual({ activeCameraId: null });
  });
});
