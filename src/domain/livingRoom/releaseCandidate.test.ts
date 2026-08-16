import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
  validateInteriorProject,
} from "../interiorProject";
import {
  createLivingRoomRecoverySnapshot,
  interiorProjectFingerprint,
  persistLivingRoomRecovery,
  readLivingRoomRecovery,
} from "./desktopExperience";
import { moveLivingRoomObject } from "./planCommands";
import { createLivingRoomRenderResult } from "./renderStudio";
import { createLivingRoomReleaseDemoProject } from "./releaseDemo";
import { compileLivingRoomScene } from "./sceneCompiler";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("LR-08 release candidate", () => {
  it("creates identical stable demo documents on every run", () => {
    const first = createLivingRoomReleaseDemoProject();
    const second = createLivingRoomReleaseDemoProject();

    expect(first).toEqual(second);
    expect(first.id).toBe("living-room-release-demo");
    expect(first.objects).toHaveLength(11);
    expect(first.objects.some((object) => object.catalogItemId === "living:indoor-plant")).toBe(true);
    expect(first.objects.some((object) => object.catalogItemId === "living:bookcase")).toBe(true);
    expect(first.cameras.find((camera) => camera.isDefault)?.name).toBe("Wide Room");
    expect(first.renderSettings).toMatchObject({
      widthPx: 2560,
      heightPx: 1440,
      quality: "presentation",
      lightingRecipeId: "daylight",
    });
    expect(validateInteriorProject(first).issues).toEqual([]);
  });

  it("passes edit, compile, render metadata, save, reopen, and recovery without divergence", () => {
    const source = createLivingRoomReleaseDemoProject();
    const table = source.objects.find((object) => object.catalogItemId === "living:coffee-table")!;
    const edited = {
      ...moveLivingRoomObject(source, table.id, { x: 125, y: 0, z: -125 }),
      updatedAt: "2026-08-12T13:00:00.000Z",
    };
    const immutableSnapshot = structuredClone(edited);
    const before = compileLivingRoomScene(edited);
    const camera = edited.cameras.find(
      (item) => item.id === edited.renderSettings.activeCameraId,
    )!;
    const render = createLivingRoomRenderResult({
      dataUrl: "data:image/png;base64,release-candidate",
      project: edited,
      sceneFingerprint: before.fingerprint,
      camera,
      now: "2026-08-12T13:30:00.000Z",
    });
    const serialized = serializeInteriorProjectFile(
      edited,
      "2026-08-12T14:00:00.000Z",
    );
    const reopened = loadInteriorProjectFile(serialized).document;
    const after = compileLivingRoomScene(reopened);
    const storage = memoryStorage();
    persistLivingRoomRecovery(
      createLivingRoomRecoverySnapshot(reopened, "2026-08-12T14:30:00.000Z"),
      storage,
    );
    const recovered = readLivingRoomRecovery(storage).snapshot!.project;

    expect(edited).toEqual(immutableSnapshot);
    expect(render.sceneFingerprint).toBe(before.fingerprint);
    expect(render.widthPx).toBe(2560);
    expect(interiorProjectFingerprint(reopened)).toBe(
      interiorProjectFingerprint(edited),
    );
    expect(after.fingerprint).toBe(before.fingerprint);
    expect(after.bounds).toEqual(before.bounds);
    expect(after.nodes).toEqual(before.nodes);
    expect(interiorProjectFingerprint(recovered)).toBe(
      interiorProjectFingerprint(reopened),
    );
  });

  it("compiles the full demo repeatedly within the release performance budget", () => {
    const project = createLivingRoomReleaseDemoProject();
    const startedAt = performance.now();
    let fingerprint = "";
    for (let index = 0; index < 100; index += 1) {
      fingerprint = compileLivingRoomScene(project).fingerprint;
    }
    const durationMs = performance.now() - startedAt;

    expect(fingerprint).toMatch(/^lr-scene-v1-/);
    expect(durationMs).toBeLessThan(2000);
  });
});
