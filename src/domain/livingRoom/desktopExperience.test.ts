import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import {
  LIVING_ROOM_RECOVERY_STORAGE_KEY,
  clearLivingRoomRecovery,
  createLivingRoomPlanThumbnail,
  createLivingRoomRecoverySnapshot,
  interiorProjectFingerprint,
  persistLivingRoomRecovery,
  readLivingRoomRecovery,
} from "./desktopExperience";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(LIVING_ROOM_RECOVERY_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("living-room desktop experience", () => {
  it("round-trips a canonical recovery snapshot", () => {
    const storage = memoryStorage();
    const project = createLivingRoomStarterProject({ now: "2026-08-12T00:00:00.000Z" });
    persistLivingRoomRecovery(
      createLivingRoomRecoverySnapshot(project, "2026-08-12T01:00:00.000Z"),
      storage,
    );

    const recovered = readLivingRoomRecovery(storage);
    expect(recovered.error).toBeNull();
    expect(recovered.snapshot?.project.id).toBe(project.id);
    expect(recovered.snapshot?.project.objects).toHaveLength(15);
  });

  it("removes corrupt recovery data safely", () => {
    const storage = memoryStorage("{broken");
    const recovered = readLivingRoomRecovery(storage);
    expect(recovered.snapshot).toBeNull();
    expect(recovered.error).toBeTruthy();
    expect(storage.getItem(LIVING_ROOM_RECOVERY_STORAGE_KEY)).toBeNull();
  });

  it("clears recovery snapshots explicitly", () => {
    const storage = memoryStorage();
    const project = createLivingRoomStarterProject();
    persistLivingRoomRecovery(createLivingRoomRecoverySnapshot(project), storage);
    clearLivingRoomRecovery(storage);
    expect(storage.getItem(LIVING_ROOM_RECOVERY_STORAGE_KEY)).toBeNull();
  });

  it("ignores timestamp-only changes in project fingerprints", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-12T00:00:00.000Z" });
    expect(interiorProjectFingerprint(project)).toBe(
      interiorProjectFingerprint({ ...project, updatedAt: "2026-08-13T00:00:00.000Z" }),
    );
  });

  it("creates a self-contained SVG plan thumbnail", () => {
    const project = createLivingRoomStarterProject({ projectName: "Sample & Studio" });
    const thumbnail = createLivingRoomPlanThumbnail(project);
    expect(thumbnail).toMatch(/^data:image\/svg\+xml/);
    expect(decodeURIComponent(thumbnail)).toContain("Sample &amp; Studio");
    expect(decodeURIComponent(thumbnail)).toContain("<rect");
  });
});
