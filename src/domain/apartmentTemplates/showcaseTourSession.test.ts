import { afterEach, describe, expect, it } from "vitest";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { instantiateApartmentTemplate } from "./instantiateApartmentTemplate";
import { showcaseTourStops } from "./showcaseTour";
import { showcaseTourDurationMs } from "./showcaseTourController";
import { onShowcaseCameraJump, resetShowcaseCameraJumpForTests, takeShowcaseGlideMs, type ShowcaseJumpTarget } from "./showcaseJump";
import { ShowcaseTourSession, type ShowcaseTourState } from "./showcaseTourSession";
import { deepFreeze, manualScheduler } from "./showcaseTourTestSupport";
import { pickModelViewCameraId } from "../livingRoom/modelViewDefaults";

const project = deepFreeze(instantiateApartmentTemplate("template:apartment:3bhk:v1", { now: COMPOSER_TEST_NOW }));
const stops = showcaseTourStops(project);
const DOC_CAMERA = project.renderSettings.activeCameraId!;

const savedRoomCameras = project.cameras.filter((camera) => camera.roomId === project.activeRoomId);
/** A camera the user added to the room and picked in Model View, without making it the document's camera. */
const USER_CAMERA = { ...savedRoomCameras[0]!, id: "camera:user-corner", name: "Corner", isDefault: false };
const documentRoomCameras = [...savedRoomCameras, USER_CAMERA];
/** As in useShowcaseTour: the pre-tour camera if it is in the document's room, else the document's camera. */
const restoreInDocumentRoom = (cameraBefore: string | null) =>
  pickModelViewCameraId(documentRoomCameras, [cameraBefore, DOC_CAMERA]);

function harness() {
  const clock = manualScheduler();
  const tours: ShowcaseTourState[] = [];
  const presets: string[] = [];
  const cameras: Array<string | null> = [];
  const jumps: ShowcaseJumpTarget[] = [];
  onShowcaseCameraJump((_nonce, target) => { if (target) jumps.push(target); });
  const session = new ShowcaseTourSession<string>({
    setTour: (state) => tours.push(state),
    setViewPreset: (preset) => presets.push(preset),
    setActiveCameraId: (cameraId) => cameras.push(cameraId),
    restoreCameraId: restoreInDocumentRoom,
  }, clock.scheduler);
  const canvasHost = new EventTarget();
  const keyboard = new EventTarget();
  const start = (viewPreset = "dollhouse", cameraId: string | null = DOC_CAMERA) => session.start(
    stops, { activeRoomId: project.activeRoomId, viewPreset, cameraId }, { canvasHost, keyboard },
  );
  const lastReason = () => tours.at(-1)?.lastStopReason ?? null;
  return { clock, tours, presets, cameras, jumps, session, canvasHost, keyboard, start, lastReason };
}

const keydown = (key: string): Event => Object.assign(new Event("keydown"), { key });

afterEach(() => resetShowcaseCameraJumpForTests());

describe("Showcase tour session (3 BHK)", () => {
  it("drives every room's camera through the jump signal and leaves the document and undo history alone", () => {
    const h = harness();
    const before = JSON.stringify({ project, room: null });
    expect(h.start()).toBe(true);
    h.clock.advance(showcaseTourDurationMs(stops.length));
    expect(h.jumps.map((jump) => jump.cameraId)).toEqual(stops.map((stop) => stop.cameraId));
    expect(h.jumps.every((jump) => (jump.glideMs ?? 0) >= 1000)).toBe(true);
    expect(takeShowcaseGlideMs()).toBe(h.jumps.at(-1)!.glideMs);
    expect(takeShowcaseGlideMs()).toBeNull();
    // One view update per stop (React renders per room, the rig interpolates per frame) + the end.
    expect(h.tours.filter((state) => state.active).map((state) => state.roomId)).toEqual(stops.map((stop) => stop.roomId));
    expect(h.lastReason()).toBe("finished");
    // Back on the document's camera and the preset from before the tour.
    expect(h.cameras).toEqual([DOC_CAMERA]);
    expect(h.presets).toEqual(["dollhouse"]);
    // Frozen document: any write would have thrown; the autosave fingerprint is unchanged.
    expect(JSON.stringify({ project, room: null })).toBe(before);
  });

  it.each([
    ["pointerdown", "canvas"],
    ["wheel", "canvas"],
  ])("a %s on the canvas stops it immediately and is swallowed", (type, reason) => {
    const h = harness();
    h.start();
    h.clock.advance(2000);
    const event = new Event(type, { cancelable: true });
    let reachedScene = false;
    h.canvasHost.addEventListener(type, () => { reachedScene = true; });
    h.canvasHost.dispatchEvent(event);
    expect(h.lastReason()).toBe(reason);
    expect(event.defaultPrevented).toBe(true);
    expect(reachedScene).toBe(false);
    h.clock.advance(showcaseTourDurationMs(stops.length));
    expect(h.jumps).toHaveLength(1);
  });

  it("Escape stops it; other keys do not; listeners are removed after the stop", () => {
    const h = harness();
    h.start();
    h.keyboard.dispatchEvent(keydown("ArrowLeft"));
    expect(h.session.active).toBe(true);
    h.keyboard.dispatchEvent(keydown("Escape"));
    expect(h.lastReason()).toBe("escape");
    const pointer = new Event("pointerdown", { cancelable: true });
    h.canvasHost.dispatchEvent(pointer);
    expect(pointer.defaultPrevented).toBe(false);
    expect(h.tours.filter((state) => !state.active)).toHaveLength(1);
  });

  it("stopping returns to the camera the user was on before the tour, not just the saved one", () => {
    const h = harness();
    h.start("dollhouse", USER_CAMERA.id);
    h.clock.advance(2000);
    h.session.stop("user");
    expect(h.cameras).toEqual([USER_CAMERA.id]);
    expect(h.presets).toEqual(["dollhouse"]);
    // A pre-tour camera that is not in the document's room falls back to the document's camera.
    const again = harness();
    again.start("dollhouse", stops[2]!.cameraId);
    again.session.stop("user");
    expect(again.cameras).toEqual([DOC_CAMERA]);
  });

  it("switching rooms stops it and keeps the user's new room", () => {
    const h = harness();
    h.start();
    h.session.observe({ activeRoomId: project.activeRoomId, viewPreset: "perspective" });
    expect(h.session.active).toBe(true);
    h.session.observe({ activeRoomId: stops[3]!.roomId, viewPreset: "perspective" });
    expect(h.lastReason()).toBe("room-switch");
    h.clock.advance(showcaseTourDurationMs(stops.length));
    expect(h.jumps).toHaveLength(1);
  });

  it("picking another view preset stops it without overriding that preset", () => {
    const h = harness();
    h.start("top");
    h.session.observe({ activeRoomId: project.activeRoomId, viewPreset: "walkthrough" });
    expect(h.lastReason()).toBe("view-change");
    expect(h.presets).toEqual([]);
  });

  it("leaving 3D (unmount) stops timers and listeners without touching unmounted state", () => {
    const h = harness();
    h.start();
    const updates = h.tours.length;
    h.session.dispose();
    expect(h.session.active).toBe(false);
    expect(h.clock.pending()).toBe(0);
    expect(h.tours).toHaveLength(updates);
    expect(h.cameras).toEqual([]);
    h.keyboard.dispatchEvent(keydown("Escape"));
    expect(h.tours).toHaveLength(updates);
    expect(h.session.start(stops, { activeRoomId: null, viewPreset: "dollhouse", cameraId: null })).toBe(false);
  });
});
