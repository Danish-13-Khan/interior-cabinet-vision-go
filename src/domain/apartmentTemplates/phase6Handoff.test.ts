import { describe, expect, it } from "vitest";
import { cabinetFinishId } from "../livingRoom/cabinetFinish";
import { pendingTemplateOffer } from "./pendingTemplateOffer";
import {
  PENDING_TEMPLATE_STORAGE_KEY,
  PENDING_TEMPLATE_TTL_MS,
  peekPendingTemplate,
  stashPendingTemplate,
  takePendingTemplate,
} from "./pendingTemplateHandoff";
import { instantiateApartmentTemplate } from "./instantiateApartmentTemplate";
import { showcaseCameraPatch } from "./showcaseCamera";
import {
  onShowcaseCameraJump,
  requestShowcaseCameraJump,
  resetShowcaseCameraJumpForTests,
} from "./showcaseJump";
import { finishIdForRoleMaterial } from "./specs/finishRoles";

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
    const now = Date.now();
    expect(pendingTemplateOffer(storage)).toBeNull();
    stashPendingTemplate("template:apartment:2bhk:v1", storage, now);
    const offer = pendingTemplateOffer(storage);
    expect(offer).toMatchObject({ templateId: "template:apartment:2bhk:v1", kind: "apartment" });
    // Reading the offer (e.g. opening the project home) never clears or creates anything.
    expect(peekPendingTemplate(storage, now)).toBe("template:apartment:2bhk:v1");
    expect(JSON.parse(storage.store.get(PENDING_TEMPLATE_STORAGE_KEY)!)).toMatchObject({
      templateId: "template:apartment:2bhk:v1",
      expiresAt: now + PENDING_TEMPLATE_TTL_MS,
    });
    expect(pendingTemplateOffer(null)).toBeNull();
  });

  it("expires after about seven days and ignores unknown ids", () => {
    const storage = memoryStorage();
    stashPendingTemplate("template:apartment:2bhk:v1", storage, 1_000);
    expect(peekPendingTemplate(storage, 1_000 + PENDING_TEMPLATE_TTL_MS + 1)).toBeNull();
    expect(storage.store.has(PENDING_TEMPLATE_STORAGE_KEY)).toBe(false);

    stashPendingTemplate("template:nope", storage);
    expect(pendingTemplateOffer(storage)).toBeNull();
  });

  it("still reads a legacy plain-string stash", () => {
    const storage = memoryStorage();
    storage.setItem(PENDING_TEMPLATE_STORAGE_KEY, "template:apartment:1bhk:v1");
    expect(takePendingTemplate(storage, 1_000)).toBe("template:apartment:1bhk:v1");
    expect(takePendingTemplate(storage, 1_000)).toBeNull();
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

  it("Showcase jump fires even when the camera patch is null", () => {
    resetShowcaseCameraJumpForTests();
    const seen: number[] = [];
    const stop = onShowcaseCameraJump((n) => seen.push(n));
    expect(requestShowcaseCameraJump()).toBe(1);
    expect(requestShowcaseCameraJump()).toBe(2);
    expect(seen).toEqual([1, 2]);
    stop();
  });
});

describe("cabinet finishId sync with finish roles", () => {
  it("cabinet finishId matches the role finish (not the wood-oak default)", () => {
    const project = instantiateApartmentTemplate("template:apartment:studio:v1");
    const roles = project.extensions?.finishRoles as Record<string, string>;
    expect(project.extensions?.finishIds).toBeTruthy();
    const cabinets = project.objects.filter((o) => o.kind === "cabinet" && o.category !== "filler");
    expect(cabinets.length).toBeGreaterThan(0);
    for (const cabinet of cabinets) {
      const accent = ["living:tv-unit", "living:display-niche", "living:open-shelf-900", "living:bookcase"]
        .includes(String(cabinet.catalogItemId));
      const role = accent ? "front-accent" : "front-primary";
      expect(cabinetFinishId(cabinet), cabinet.id).toBe(finishIdForRoleMaterial(roles[role]));
    }
  });
});
